# AWS deployment

This stack uses S3 and CloudFront for the React frontend and AWS Lambda behind an API Gateway HTTP API for the Spring Boot backend.

## Prerequisites

- AWS CLI configured for the target account
- AWS SAM CLI
- Java 21 and Maven for local backend development

## Provision infrastructure

Set the region and stack values for the target AWS account:

```bash
export AWS_REGION=us-east-1
export STACK_NAME=aboutshane
export CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Build the Lambda artifact and SAM application:

```bash
cd backend
mvn -B clean package -DskipTests
cd ..
sam build --template-file infra/template.yaml
```

Deploy the stack:

```bash
sam deploy \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides CorsAllowedOrigins="$CORS_ALLOWED_ORIGINS"
```

Read the API Gateway URL from the stack outputs:

```bash
aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BackendUrl'].OutputValue" \
  --output text
```

The backend health check is available at the `BackendUrl` CloudFormation output plus `/health`. The current contact form still sends through its existing EmailJS integration; no EmailJS secrets are moved into AWS by this change.

## Deploy the frontend

Read the S3 bucket and CloudFront distribution outputs, then run:

```bash
export FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)
export CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --region "$AWS_REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendDistributionId'].OutputValue" \
  --output text)

AWS_REGION="$AWS_REGION" \
FRONTEND_BUCKET="$FRONTEND_BUCKET" \
CLOUDFRONT_DISTRIBUTION_ID="$CLOUDFRONT_DISTRIBUTION_ID" \
./infra/deploy-frontend.sh
```
