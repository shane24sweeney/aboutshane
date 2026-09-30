# AWS deployment

One SAM stack (`template.yaml`) holds the whole site: S3 + CloudFront for the frontend, and an
API Gateway HTTP API + Lambda (Spring Boot) + DynamoDB + SES for the contact form. CloudFront
routes `/api/*` to the API, so the frontend calls it on the same origin.

## Prerequisites

- AWS CLI signed in to the target account
- AWS SAM CLI
- Java 21 and Maven, Node 20+

## Deploy the stack

`sam build` runs `backend/Makefile`, which packages the Lambda jar itself.

```bash
sam build --template-file infra/template.yaml
sam deploy \
  --stack-name aboutshane \
  --region us-east-1 \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM
```

Parameters default to the production values (domain, certificate and Route 53 zone); override
them with `--parameter-overrides`. `ContactRecipientEmail`, the address that receives contact
messages, has no default so it stays out of this public repo. Pass it on the stack's first deploy:

```bash
sam deploy ... --parameter-overrides ContactRecipientEmail=you@example.com
```

Later deploys keep the stack's current value, so the command above works unchanged.

### Email (SES)

The stack verifies `selenium-automation.com` as a sending domain by writing its DKIM records to
Route 53. While the account is in the SES sandbox, the recipient address must be verified too:
the first deploy sends a verification link to `ContactRecipientEmail`, and emails are rejected
until it is clicked. Messages are still stored in DynamoDB in the meantime.

## How the backend is built and deployed

The two commands in [Deploy the stack](#deploy-the-stack) do everything. SAM reads
`infra/template.yaml`, builds the Java code, and has CloudFormation create or update every AWS
resource.

### 1. `sam build`: the Java code becomes a Lambda package

```
infra/template.yaml
  BackendFunction  (BuildMethod: makefile, CodeUri: ../backend)
        │
        ▼
backend/Makefile   build-BackendFunction
        │  mvn package -DskipTests
        ▼
backend/target/contact-api-0.0.1-SNAPSHOT-lambda.jar
        │  one jar with Spring Boot, the AWS SDK and content/*.json inside
        │  (maven-shade-plugin; pom.xml adds ../content as a resource folder)
        ▼
.aws-sam/build/BackendFunction/   the jar, unpacked, ready to upload
```

`BuildMethod: makefile` tells SAM to run `backend/Makefile` instead of building the code itself.
The page text in `content/*.json` is packed into the jar, so the API serves the same content the
frontend bundles as its fallback. Tests don't run here; CI runs `mvn verify`.

### 2. `sam deploy`: the AWS resources are created or updated

`--resolve-s3` uploads the build to a bucket SAM manages. SAM turns the template into a
CloudFormation change set and applies it to the `aboutshane` stack. `CAPABILITY_IAM` allows the
stack to create the Lambda function's IAM role. The backend's resources:

| Resource | What it is | Key settings |
|---|---|---|
| `ContactMessagesTable` | DynamoDB table for contact messages | Pay per request; messages expire after a year |
| `SesDomainIdentity`, `SesDkimRecords` | Lets SES send as `noreply@selenium-automation.com` | Writes the DKIM records into Route 53 |
| `SesRecipientIdentity` | The address that receives messages | Must be verified while SES is in sandbox mode |
| `BackendLogGroup` | CloudWatch logs for the function | Kept 30 days |
| IAM role (made by SAM) | What the function may do | Write to the table; send email from the two SES identities only |
| `BackendFunction` | The Lambda function | Java 21, 1 GB, 30 s timeout; handler `StreamLambdaHandler`; SnapStart on the `live` alias for fast cold starts; table and email settings as environment variables |
| `BackendApi` | API Gateway HTTP API | Every route goes to the function; 2 requests/second, bursts of 10, then 429 |
| CloudFront behaviours | How `/api/*` on the site reaches the API | `/api/content/*` cached for 5 minutes; other `/api/*` never cached |

### 3. How a request reaches the code

```
Browser ─► CloudFront (selenium-automation.com/api/...)
             ├─ /api/content/*  cached 5 min at the edge; most clicks stop here
             └─ /api/*          ─► HTTP API (throttled) ─► Lambda: StreamLambdaHandler
                                                              │  Spring Boot, started once, then reused
                                                              ▼
                                        ContactController / ContentController
                                              │                    │
                                   ContactService            ContentRepository
                                   ├─ DynamoDB: save          (content/*.json, loaded at startup)
                                   └─ SES: email the owner
```

`StreamLambdaHandler` uses `aws-serverless-java-container` to turn each API Gateway request into
a normal HTTP request for Spring Boot. The controllers are ordinary Spring code, so the backend
tests exercise the same controllers with MockMvc.

| Endpoint | Does |
|---|---|
| `GET /api/health` | Returns `{"status":"ok"}` |
| `POST /api/contact` | Validates the message, drops honeypot spam, saves it to DynamoDB, then emails it. A failed email never loses a saved message |
| `GET /api/content/{profile,about,resume,testimonials,education,charity}` | Page text as JSON, cacheable for 5 minutes |

### 4. See what was created

```bash
aws cloudformation describe-stacks --stack-name aboutshane --region us-east-1 --query "Stacks[0].Outputs"
aws cloudformation list-stack-resources --stack-name aboutshane --region us-east-1 --output table
aws lambda get-function --function-name aboutshane-backend --region us-east-1 \
  --query "Configuration.{runtime:Runtime,memory:MemorySize,snapStart:SnapStart.ApplyOn}" --output table
aws logs tail /aws/lambda/aboutshane-backend --region us-east-1 --follow
curl https://selenium-automation.com/api/health
```

## Deploy the frontend

```bash
AWS_REGION=us-east-1 \
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name aboutshane --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text) \
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name aboutshane --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" --output text) \
./infra/deploy-frontend.sh
```

The script builds the site, syncs it to S3, and invalidates the CloudFront cache.

## After deploying

```bash
npm run test:smoke
```

## Cost

At portfolio traffic, everything except Route 53 stays inside AWS's always-free allowances; a
monthly AWS Budgets alert (`monthly-5-usd`) emails the owner if spend rises. The HTTP API is
throttled to 2 requests/second (burst 10) to cap abuse.
