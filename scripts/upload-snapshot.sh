#!/usr/bin/env bash
set -euo pipefail

# Upload the local namescout database to Cloudflare R2.
#
# Requires R2 API token with "Admin Read & Write" permission.
# See: https://developers.cloudflare.com/r2/data-catalog/get-started/
#
# Usage:
#   bash scripts/upload-snapshot.sh              # uses ~/.namescout/namescout.db
#   bash scripts/upload-snapshot.sh ./custom.db   # uses custom path

DB_PATH="${1:-$HOME/.namescout/namescout.db}"
ENV_FILE="${2:-.env}"

if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database not found at $DB_PATH"
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ] || [ -z "${R2_ACCESS_KEY_ID:-}" ] || [ -z "${R2_SECRET_ACCESS_KEY:-}" ]; then
  echo "Error: Missing env vars. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
  echo "Either export them or create a .env file"
  exit 1
fi

# Configure rclone for R2 on the fly (no config file needed)
export RCLONE_CONFIG_R2_TYPE=s3
export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

DB_SIZE=$(du -h "$DB_PATH" | cut -f1)

# Upload raw db
echo "Uploading ${DB_SIZE} snapshot to R2..."
rclone copyto "$DB_PATH" r2:namescout-snapshots/namescout.db --progress --s3-no-check-bucket

# Upload zstd-compressed version if zstd is available
if command -v zstd &>/dev/null; then
  ZST_PATH="${DB_PATH}.zst"
  echo ""
  echo "Compressing with zstd..."
  zstd -f --rm=no -19 "$DB_PATH" -o "$ZST_PATH"
  ZST_SIZE=$(du -h "$ZST_PATH" | cut -f1)
  echo "Uploading ${ZST_SIZE} compressed snapshot to R2..."
  rclone copyto "$ZST_PATH" r2:namescout-snapshots/namescout.db.zst --progress --s3-no-check-bucket
  rm -f "$ZST_PATH"
else
  echo "zstd not found, skipping compressed upload"
fi

echo ""
echo "Done."
echo "  Raw: https://pub-394f36a4383644b695b253701e1fe153.r2.dev/namescout.db"
echo "  Zst: https://pub-394f36a4383644b695b253701e1fe153.r2.dev/namescout.db.zst"
