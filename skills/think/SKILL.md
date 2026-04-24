---
name: namescout-think
description: Generate and validate npm package names. Use when the user needs help naming a package, wants creative name suggestions, or says things like "help me name this", "what should I call this package", or "I need a name for...".
metadata:
  author: zrosenbauer
  version: '0.0.1'
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

### Step 2: Generate & Validate

Generate 15-20 candidate names, then **validate them all before showing anything to the user**. The user should never see an unvalidated list.

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

#### Validating with namescout

Run checks in batches of 5-7 names to avoid npm registry rate limits (403 errors):

```bash
! namescout check name1 name2 name3 name4 name5 --format=agent
```

If a batch hits a 403, split it smaller and retry. Collect all results before presenting.

### Step 3: Present Results

Present results using this template — only actionable names in the main table, with taken/high-risk collapsed into a summary:

```
## Available Names

| # | Name | Risk | Similar Packages |
|---|------|------|-----------------|
| 1 | **name** | LOW | closest1, closest2 |
| 2 | **name** | MEDIUM | closest1 |

---

**Skipped N names:** X taken, Y squatted, Z high-risk.
<details><summary>Show skipped names</summary>

| Name | Status | Reason |
|------|--------|--------|
| name1 | TAKEN | Already published |
| name2 | SQUATTED | Squatter sitting on it |

</details>
```

**Rules:**

- Main table: only AVAILABLE names with LOW or MEDIUM risk, sorted by risk (LOW first)
- Skipped summary: one line with counts, then a collapsible details block
- If zero names were skipped, omit the skipped section

If no good options emerge, generate a second batch focusing on different naming strategies and re-check.

### Step 5: Final Pick

Help the user choose by considering:

- Does it sound good when spoken aloud?
- Is it easy to type and remember?
- Does the npm scope (`@org/name`) change the calculus?
- How does it look in `import { ... } from 'name'`?
