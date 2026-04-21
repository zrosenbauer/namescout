#!/usr/bin/env bash
set -euo pipefail

if ! command -v monkeywrench &>/dev/null; then
  echo "monkeywrench not found. Installing..."
  npm install -g @monkeywrench/cli
fi

if ! monkeywrench sync --check 2>/dev/null; then
  echo "Initializing monkeywrench database..."
  monkeywrench sync
fi

echo "monkeywrench is ready."
