#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${1:-$HOME/.namescout/namescout.db}"
ENV_FILE="${2:-.env}"

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database not found at $DB_PATH"
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] || [ -z "${R2_ACCESS_KEY_ID:-}" ] || [ -z "${R2_SECRET_ACCESS_KEY:-}" ]; then
  echo "Error: Missing env vars. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
  echo "Either export them or create a .env file"
  exit 1
fi

echo "Uploading $(du -h "$DB_PATH" | cut -f1) snapshot to R2..."

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION=auto \
aws s3 cp "$DB_PATH" s3://namescout-snapshots/namescout.db \
  --endpoint-url "https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "Done. Available at: https://pub-394f36a4383644b695b253701e1fe153.r2.dev/namescout.db"
