#!/usr/bin/env bash
set -euo pipefail

# Helper script to deploy the site to an Azure Storage static website
# Usage: AZURE_STORAGE_ACCOUNT=myaccount ./scripts/azure_deploy.sh

if [ -z "${AZURE_STORAGE_ACCOUNT:-}" ]; then
  echo "Please set AZURE_STORAGE_ACCOUNT environment variable."
  exit 1
fi

echo "Enabling static website on storage account: $AZURE_STORAGE_ACCOUNT"
az storage blob service-properties update --account-name "$AZURE_STORAGE_ACCOUNT" --static-website --index-document index.html --error-document index.html

echo "Uploading files to the $web container..."
az storage blob upload-batch --account-name "$AZURE_STORAGE_ACCOUNT" -s . -d '$web' \
  --pattern "index.html" --pattern "css/*" --pattern "js/*" --pattern "icons/*" --pattern "assets/*" --pattern "manifest.webapp" --overwrite

echo "Deployment finished. Static website URL:"
az storage account show -n "$AZURE_STORAGE_ACCOUNT" --query "primaryEndpoints.web" -o tsv
