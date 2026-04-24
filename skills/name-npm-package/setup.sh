#!/usr/bin/env bash
set -euo pipefail

if ! command -v namescout &>/dev/null; then
  echo "namescout not found. Installing..."
  npm install -g namescout
fi

if [ ! -f "$HOME/.namescout/namescout.db" ]; then
  echo "Initializing namescout database..."
  namescout sync
fi

echo "namescout is ready."
