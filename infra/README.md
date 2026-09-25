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

Parameters default to the production values (domain, certificate, Route 53 zone, and the
address that receives contact messages); override them with `--parameter-overrides`.

### Email (SES)

The stack verifies `selenium-automation.com` as a sending domain by writing its DKIM records to
Route 53. While the account is in the SES sandbox, the recipient address must be verified too:
the first deploy sends a verification link to `ContactRecipientEmail`, and emails are rejected
until it is clicked. Messages are still stored in DynamoDB in the meantime.

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
