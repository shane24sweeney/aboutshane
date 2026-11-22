#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?Set AWS_REGION before deploying}"
: "${FRONTEND_BUCKET:?Set FRONTEND_BUCKET to the CloudFormation output}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID to the CloudFormation output}"

COVERAGE= npm run build
# Never ship the coverage build (npm run build:coverage): it's instrumented and has source maps.
if grep -rqs "__coverage__" frontend/build/assets || compgen -G "frontend/build/assets/*.map" >/dev/null; then
  echo "frontend/build is a coverage build; refusing to deploy it" >&2
  exit 1
fi
# Browser caching: files under assets/ have a content hash in their names, so a new build never
# reuses a name and browsers can keep them for a year. Pages are re-checked on every visit so a
# deploy shows at once, and the remaining files (icons, images in public/) are kept for a day.
aws s3 sync frontend/build/assets "s3://${FRONTEND_BUCKET}/assets" --delete \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync frontend/build "s3://${FRONTEND_BUCKET}" --delete --exclude "assets/*" --exclude "*.html" \
  --cache-control "public, max-age=86400"
# Pages are always uploaded (not synced), so a changed page never keeps an old copy.
aws s3 cp frontend/build "s3://${FRONTEND_BUCKET}" --recursive --exclude "*" --include "*.html" \
  --cache-control "no-cache" --content-type "text/html; charset=utf-8" --only-show-errors
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths '/*'
