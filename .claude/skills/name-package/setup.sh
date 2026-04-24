#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CLI_DIST="$REPO_ROOT/packages/cli/dist/index.mjs"

if [ ! -f "$CLI_DIST" ]; then
  echo "CLI not built. Building..."
  cd "$REPO_ROOT" && pnpm build
fi

if [ ! -f "$HOME/.namescout/namescout.db" ]; then
  echo "No local database found. Running initial sync (this takes a few minutes)..."
  node "$CLI_DIST" sync
fi

echo "namescout is ready (local dev build)."
