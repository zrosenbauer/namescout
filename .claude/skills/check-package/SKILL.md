---
name: check-package
description: Check npm package name availability, squatter detection, and similarity scoring. Use when the user wants to validate whether a package name is available, taken, or squatted.
metadata:
  author: zrosenbauer
  version: "0.0.1"
---

# Check npm Package Names

Validate one or more npm package names for availability, squatter status, and similarity to existing packages.

## Setup

Run the setup script to ensure the local build and database are ready:

```bash
bash .claude/skills/check-package/setup.sh
```

## CLI Path

The local dev build is at:

```
node packages/cli/dist/index.mjs
```

All commands below use this path. If the build is missing, run `pnpm build` first.

## Usage

Check one or more names:

```bash
node packages/cli/dist/index.mjs check <name1> <name2> <name3> --format=agent
```

Check names from a JSON file:

```bash
node packages/cli/dist/index.mjs check --file /tmp/mw-candidates.json --format=agent
```

The JSON file should be an array of strings:

```json
["name1", "name2", "name3"]
```

## Reading Results

Each name is scored with:
- **AVAILABLE** — name is not taken on npm
- **TAKEN** — name exists and is actively maintained
- **SQUATTED** — name exists but appears to be hogged (low quality, no activity)
- **Risk level** — LOW / MEDIUM / HIGH based on availability + similarity to existing packages

Always use `--format=agent` when calling from a skill context. This returns compressed markdown optimized for agent consumption.
