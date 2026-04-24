---
name: name-npm-package
description: Interactive npm package naming workshop. Use when the user needs help naming a package, wants creative name suggestions, or says things like "help me name this", "what should I call this package", "I need a name for...", "name ideas for", or "brainstorm names". Also trigger when the user is building something new and hasn't settled on a name yet.
metadata:
  author: zrosenbauer
  version: '0.1.0'
---

# Think — npm Package Naming Workshop

An interactive, iterative naming workflow. You generate candidates using configurable styles and creativity, validate them against the npm registry with namescout, then work with the user to rank favorites and re-run until they land on the perfect name.

## Setup

Run the setup script to ensure the CLI is installed and the database is ready:

```bash
bash ./setup.sh
```

## Interacting with the User

Throughout this workflow you need the user's input at several points — their package description, style preferences, creativity level, rankings, and iteration decisions.

**If you have access to `AskUserQuestion`** (e.g., in Claude Code, Copilot CLI, or any agent environment with that tool): use it for every question. This keeps the conversation structured and ensures you wait for their response before proceeding.

**If you don't have `AskUserQuestion`**: ask inline and wait for the user's reply before moving on. Never assume answers.

## Workflow

### Step 1 — Understand the Package

Ask the user to describe what they're naming. Gather:

- **What it does** — 1-2 sentence description of the package's purpose
- **Ecosystem** — React, Node, CLI tool, library, framework plugin, etc.
- **Vibe** — professional, playful, minimal, techy, elegant, punchy, etc.
- **Any words or themes** they already like or want to avoid

If the user is vague, probe a little. The better you understand the package, the better the names.

### Step 2 — Configure the Session

Present the user with three choices. Use sensible defaults if they want to skip ahead.

#### Naming Styles

Offer these styles. The user can pick one, several, or "all" (default: all).

| Style | Description | Example |
|---|---|---|
| **Portmanteau** | Blend two relevant words into one | `fetchcraft`, `logmeld` |
| **Metaphor** | Borrow a concept from another domain | `anvil` (build tool), `lighthouse` (audit) |
| **Classical** | Latin, Greek, or other ancient roots | `nomen` (name), `vectis` (lever), `fluxo` (flow) |
| **Invented** | Coined words that sound right but aren't real | `zapi`, `kerno`, `plexar` |
| **Action Verb** | A verb that captures what the package does | `invoke`, `stitch`, `reap` |
| **Compound** | Two short English words joined together | `ironpipe`, `startseed`, `quickfold` |
| **Wordplay** | Puns, rhymes, alliteration, or phonetic tricks | `commitlint` (commit + lint), `sveltekit` |

#### Creativity Level

| Level | What it means |
|---|---|
| **Conservative** | Descriptive, obvious, safe. The name tells you what the package does at a glance. Good for enterprise or utility libraries. |
| **Balanced** *(default)* | A mix of clear and clever. Names are memorable but not confusing. |
| **Wild** | Abstract, invented, unexpected. Prioritizes uniqueness and brand potential over immediate clarity. Think `vercel`, `deno`, `bun`. |

#### How Many Names

Ask how many candidates to generate. Default is **10**. Maximum is **25**. More names means more variety but also more to sift through — suggest 10-15 for most sessions, 20-25 if they want to cast a wide net.

### Step 3 — Generate & Validate

Generate the requested number of names following the selected styles and creativity level, then **validate them all before showing anything to the user**. The user should never see an unvalidated list.

**Universal qualities of good npm names:**
- Short — ideally under 15 characters, under 20 max
- Pronounceable — if you can't say it out loud, it's harder to remember
- Typeable — avoid unusual spellings that cause typos
- No trademark collisions with well-known projects
- Avoid generic prefixes like `my-`, `the-`, `simple-`, `easy-`, `super-`
- Fewer hyphens is better — single words are stronger on npm

**Per creativity level adjustments:**
- **Conservative**: lean toward descriptive compound words and action verbs. Clarity over cleverness.
- **Balanced**: mix strategies. Some descriptive, some metaphorical, a couple inventions.
- **Wild**: push into invented words, unexpected metaphors, phonetic play. Sacrifice some immediate clarity for memorability and brand strength.

#### Validating with namescout

After generating candidates, check them all before presenting results. The npm registry rate-limits requests, so run checks in batches of 5-7 names at a time to avoid 403 errors:

```bash
namescout check name1 name2 name3 name4 name5 --format=agent
```

If a batch hits a 403, split it into smaller batches and retry. Collect all results before moving to the presentation step.

### Step 4 — Present Results & Rank

Present results using the output template below. The goal: the user sees only actionable names in a clean table, with taken/high-risk names collapsed into a short summary so they don't clutter the view.

#### Output Template

Use this exact structure:

```
## Available Names

| # | Name | Style | Risk | Import | Similar Packages |
|---|------|-------|------|--------|-----------------|
| 1 | **name** | Compound | LOW | `import { x } from 'name'` | closest1, closest2 |
| 2 | **name** | Metaphor | MEDIUM | `import { x } from 'name'` | closest1 |

---

**Skipped N names:** X taken, Y squatted, Z high-risk.
<details><summary>Show skipped names</summary>

| Name | Status | Reason |
|------|--------|--------|
| name1 | TAKEN | Already published |
| name2 | SQUATTED | Squatter sitting on it |
| name3 | HIGH RISK | Too similar to existing package `foo` |

</details>
```

**Rules for the template:**
- The "Available Names" table includes only AVAILABLE names with LOW or MEDIUM risk
- Sort by risk (LOW first, then MEDIUM)
- The "Import" column uses a realistic import statement for the package's ecosystem
- The "Similar Packages" column shows the top 1-3 string matches from namescout
- The skipped summary is a single line with counts, followed by a collapsible details block
- If there are zero skipped names, omit the skipped section entirely

After presenting, ask the user to **rank their top 3-5 favorites** from the available names. They can also mark names they actively dislike — this helps guide the next round.

### Step 5 — Iterate

After ranking, ask: **"Want to run another round?"**

If yes, use their feedback to sharpen the next batch:
- **Liked names** — generate more in the same style and creativity range
- **Disliked names** — avoid those patterns
- **Adjustments** — they can change the style mix, creativity level, or count for the next round
- **Refinements** — they might say "I like the vibe of X but shorter" or "more like Y but less techy"

Each round follows the same loop: generate → validate → present → rank. Keep going until the user is happy.

There's no limit on rounds — some names click on round 1, others take 4-5 iterations. The goal is to make each round more targeted than the last based on what resonated.

### Step 6 — Final Pick

When the user has a winner, do a final sanity check:

- **Say it out loud** — does it sound good in conversation? ("Have you tried X?")
- **Type it** — `npm install name` — does it feel natural?
- **Import it** — `import { thing } from 'name'` — does it read well in code?
- **Search it** — any unfortunate meanings in other languages or contexts?
- **Scope option** — would `@org/name` work better or open up a taken name?

Congratulate them on their choice and remind them to `npm init` or update their `package.json` with the new name.
