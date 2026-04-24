#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  echo "Create it with:"
  echo "  CLOUDFLARE_ACCOUNT_ID=xxx"
  echo "  R2_ACCESS_KEY_ID=xxx"
  echo "  R2_SECRET_ACCESS_KEY=xxx"
  exit 1
fi

REQUIRED_KEYS=(
  CLOUDFLARE_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
)

while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  echo "Setting $key..."
  echo "$value" | gh secret set "$key"
done < "$ENV_FILE"

echo ""
echo "Verifying secrets..."
for key in "${REQUIRED_KEYS[@]}"; do
  if gh secret list | grep -q "$key"; then
    echo "  ✓ $key"
  else
    echo "  ✗ $key (missing!)"
  fi
done

echo ""
echo "Done."
