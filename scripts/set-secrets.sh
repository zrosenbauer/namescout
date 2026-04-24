#!/usr/bin/env bash
set -euo pipefail

# Set GitHub Actions secrets from a local .env file.
#
# Reads key=value pairs and pushes each as a repo secret via `gh secret set`.
# Only sets secrets that have non-empty values.
#
# Usage:
#   bash scripts/set-secrets.sh          # uses .env
#   bash scripts/set-secrets.sh .env.ci  # uses custom file

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  echo "Create it from .env.example:"
  echo "  cp .env.example .env"
  exit 1
fi

echo "Reading secrets from $ENV_FILE..."
echo ""

while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  [ -z "$value" ] && continue
  echo "  Setting $key..."
  echo "$value" | gh secret set "$key"
done < "$ENV_FILE"

echo ""
echo "Verifying..."
gh secret list
echo ""
echo "Done."
