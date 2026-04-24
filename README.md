<div align="center">
  <h1>namescout</h1>
  <p><strong>An npm package naming toolkit — generate names, check availability, detect squatters, and run semantic similarity "vibe checks" against the entire npm registry.</strong></p>

<a href="https://github.com/zrosenbauer/namescout/actions"><img src="https://github.com/zrosenbauer/namescout/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
<a href="https://www.npmjs.com/package/namescout"><img src="https://img.shields.io/npm/v/namescout" alt="npm version" /></a>
<a href="https://github.com/zrosenbauer/namescout/blob/main/LICENSE"><img src="https://img.shields.io/github/license/zrosenbauer/namescout" alt="License" /></a>

</div>

## Why

Naming an npm package in 2025 is absurd. The registry has **4 million+ packages**, and the rules for what you can and can't publish are a mess:

- You can't use names "too similar" to existing packages — but "too similar" is [decided by an opaque algorithm](https://blog.npmjs.org/post/168978377570/new-package-moniker-rules) that nobody fully understands
- Hundreds of thousands of packages are squatted — empty `README`, no code, published once in 2014 and never touched again — but you still can't use that name
- Scoped packages (`@scope/name`) exist as a workaround, but then your users have to type `@your-scope/your-package` every time
- The npm dispute process is [slow, inconsistent, and heavily favors the incumbent](https://www.reddit.com/r/npm/comments/bp2tco/npm_package_name_disputes_are_a_mess/)
- Meanwhile, [entire conversations](https://github.com/npm/npm/issues/19629) about fixing the moniker rules go nowhere

The result? Developers burn hours brainstorming names, checking availability, getting rejected by the moniker rules, and repeating. It's a terrible experience.

**namescout** automates the painful parts:

1. **Check availability** — Is the name actually free?
2. **Detect squatters** — Is the name "taken" by an empty package nobody maintains?
3. **String similarity** — How close is your name to existing packages? (This is roughly what the moniker rules check)
4. **Semantic similarity** — Using vector embeddings of all 4M+ package names, find conceptually similar packages even if the strings don't match
5. **Risk scoring** — Get a low/medium/high risk assessment combining all signals

## Install

```bash
npm install -g namescout
```

On first run, namescout will download a pre-built database snapshot (~100MB compressed) containing all npm package names and their embeddings. Subsequent runs do delta syncs.

## Usage

### Check names

```bash
# Check one or more names
namescout check my-cool-lib another-name

# Check from a JSON file
namescout check --file candidates.json

# Output formats: table (default), json, agent
namescout check my-cool-lib --format=json
```

Example output:

```
Name          Available  Squatted  Risk       Top Match     npm Link
────────────────────────────────────────────────────────────────────────────────────
my-cool-lib   ✓ yes      -         🟢 low     my-cool-list  -
another-name  ✗ no       ⚠ likely  🟡 medium  other-name    https://www.npmjs.com/package/another-name
```

### Sync the database

```bash
# Download/update the local package database
namescout sync
```

### View past checks

```bash
# List previous check runs
namescout history
```

### Interactive dashboard

```bash
# Launch the TUI dashboard
namescout
```

## How It Works

namescout maintains a local SQLite database with:

- **All npm package names** — sourced from [`all-the-package-names`](https://github.com/nice-registry/all-the-package-names), updated daily
- **384-dimensional embeddings** — generated with [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) via [`@xenova/transformers`](https://github.com/xenova/transformers.js)
- **Vector search** — powered by [`sqlite-vec`](https://github.com/asg017/sqlite-vec) for fast KNN similarity queries

When you check a name, namescout:

1. Queries the npm registry for existence + squatter signals via [`squatter`](https://github.com/nicedoc/squatter)
2. Runs Jaro-Winkler string similarity against candidate packages via [`cmpstr`](https://github.com/nicedoc/cmpstr)
3. Embeds your name and runs a vector similarity search against all 4M+ package embeddings
4. Combines all signals into a risk score

## AI Skills

namescout ships with [Vercel AI skills](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-tool-usage) for use in AI agents:

- **`skills/check`** — Validate package name availability from an AI agent
- **`skills/think`** — Creative naming workflow powered by AI

## Monorepo Structure

```
packages/
  types/     → @namescout/types   — shared TypeScript interfaces
  db/        → @namescout/db      — SQLite + sqlite-vec layer
  data/      → @namescout/data    — sync pipeline, embeddings, snapshot download
  core/      → @namescout/core    — check pipeline (squatter → similarity → risk)
  cli/       → namescout (npm)    — CLI + Ink TUI dashboard
skills/
  check/     → Vercel skill for validating package names
  think/     → Vercel skill for creative naming workflow
```

## Further Reading

- [npm Blog: New Package Moniker Rules](https://blog.npmjs.org/post/168978377570/new-package-moniker-rules) — the original announcement that started the pain
- [npm/npm#19629: Package name dispute process](https://github.com/npm/npm/issues/19629) — years-long thread about the broken dispute system
- [Reddit: npm package name disputes are a mess](https://www.reddit.com/r/npm/comments/bp2tco/npm_package_name_disputes_are_a_mess/) — community frustration
- [Reddit: Why are so many npm package names taken by empty packages?](https://www.reddit.com/r/javascript/comments/8ck2y0/why_are_so_many_npm_package_names_taken_by_empty/) — the squatting problem
- [Sindre Sorhus on npm naming](https://github.com/sindresorhus/ama/issues/10) — even prolific package authors struggle with this

## License

[MIT](LICENSE)
