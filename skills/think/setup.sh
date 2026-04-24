#!/usr/bin/env bash
set -euo pipefail

if ! command -v namescout &>/dev/null; then
  echo "namescout not found. Installing..."
  npm install -g @namescout/cli
fi

if ! namescout sync --check 2>/dev/null; then
  echo "Initializing namescout database..."
  namescout sync
fi

echo "namescout is ready."
