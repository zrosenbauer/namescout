---
name: monkeywrench-think
description: Generate and validate npm package names. Use when the user needs help naming a package, wants creative name suggestions, or says things like "help me name this", "what should I call this package", or "I need a name for...".
metadata:
  author: zrosenbauer
  version: "0.0.1"
---

# Think of npm Package Names

A creative naming workflow that generates candidate package names and validates them against the npm registry.

## Setup

Run the setup script to ensure the CLI is installed:

```bash
! bash ./setup.sh
```

## Workflow

### Step 1: Understand What the Package Does

Ask the user to describe their package in 1-2 sentences. Focus on:
- What problem does it solve?
- What ecosystem is it in? (React, Node, CLI, etc.)
- What vibe do they want? (professional, playful, minimal, etc.)

### Step 2: Generate Candidate Names

Generate 15-20 candidate names following these heuristics:

**Good npm names:**
- Short (1-2 words, under 20 characters)
- Memorable and pronounceable
- Avoid hyphens when possible (single words are stronger)
- Evoke what the package does without being generic
- No trademark conflicts with well-known projects
- Avoid prefixes like `my-`, `the-`, `simple-`, `easy-`

**Naming strategies:**
- Portmanteaus: combine relevant words (`fetch` + `craft` = `fetchcraft`)
- Metaphors: use related concepts (`anvil` for a build tool)
- Latin/Greek roots: `nomen` (name), `vox` (voice), `flux` (flow)
- Sound symbolism: hard consonants feel fast/strong, soft sounds feel gentle
- Action words: verbs that describe the package's job

### Step 3: Validate with monkeywrench

Save candidates to a temporary JSON file and run the check:

```bash
echo '["name1", "name2", "name3"]' > /tmp/mw-candidates.json
! monkeywrench check --file /tmp/mw-candidates.json --format=agent
rm /tmp/mw-candidates.json
```

### Step 4: Present Results

Show the user the results organized by risk level:
1. **Best options** (available + low risk) — recommend these
2. **Worth considering** (available + medium risk) — note the similar packages
3. **Avoid** (taken/high risk) — explain why

If no good options emerge, generate a second batch focusing on different naming strategies and re-check.

### Step 5: Final Pick

Help the user choose by considering:
- Does it sound good when spoken aloud?
- Is it easy to type and remember?
- Does the npm scope (`@org/name`) change the calculus?
- How does it look in `import { ... } from 'name'`?
