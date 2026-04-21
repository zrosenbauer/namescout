# Monkeywrench — Design Spec

> npm package naming toolkit. Generate names, check availability, detect squatters, run semantic vibe checks against the entire npm registry.

**Note:** The name "monkeywrench" is a working title. Once the tool is functional, it will be used to name itself.

## Architecture

Turborepo monorepo with pnpm workspaces.

```
monkeywrench/
├── turbo.json
├── pnpm-workspace.yaml
├── packages/
│   ├── cli/              → @monkeywrench/cli
│   ├── core/             → @monkeywrench/core
│   ├── db/               → @monkeywrench/db
│   ├── data/             → @monkeywrench/data
│   └── types/            → @monkeywrench/types
├── skills/
│   ├── think/            → naming workflow skill
│   └── check/            → validation skill
└── .github/
    └── workflows/        → CI + weekly DB snapshot build & release
```

### Packages

**`@monkeywrench/cli`** — The kidd-based CLI. File-system autoloaded commands, Ink-based TUI dashboard. Depends on `core`.

**`@monkeywrench/core`** — Check pipeline orchestrator. Runs squatter detection, string similarity, semantic similarity, and risk scoring. Depends on `db` and `data`.

**`@monkeywrench/db`** — SQLite + sqlite-vec layer. Schema, migrations, queries, vector search, run history storage. Single DB at `~/.monkeywrench/monkeywrench.db` (XDG-style global).

**`@monkeywrench/data`** — Sync pipeline. Downloads pre-built snapshot from GitHub releases on first run. Pulls `all-the-package-names` for delta updates — only embeds new packages since last sync.

**`@monkeywrench/types`** — Shared TypeScript interfaces. Zero runtime dependencies.

## CLI Commands

```
monkeywrench                                → opens dashboard TUI (default)
monkeywrench check <name> [names...]        → score names, store results
monkeywrench check --file candidates.json   → score from file
monkeywrench sync                           → download/update package DB
monkeywrench history                        → list past runs (table)
```

### Output Formats (`check` only)

- `--format=table` (default) — pretty table for terminal
- `--format=agent` — compressed markdown for AI agent consumption
- `--format=json` — raw JSON for scripting

### First-Run Flow

1. User runs `monkeywrench check foo`
2. No DB found at `~/.monkeywrench/monkeywrench.db`
3. Auto-triggers sync: downloads pre-built snapshot from GitHub release (~500MB)
4. Runs delta check for packages added since snapshot
5. Embeds only the delta (seconds, not minutes)
6. Proceeds with the check

## Check Pipeline (`@monkeywrench/core`)

Given a list of candidate names, the pipeline runs:

### Step 1 — Squatter Detection (network, parallel per name)

Uses the `squatter` npm package. Determines both availability and squatter status. If a package doesn't exist, it's available. If it exists, squatter's heuristic determines if the owner is hogging it (exempt, useful, or high quality = not squatted).

### Step 2 — String Similarity (local, instant)

Uses `cmpstr` (Jaro-Winkler, Levenshtein, Dice-Sorensen) against the full package name list in SQLite. Returns top 10 closest string matches per candidate.

### Step 3 — Semantic Similarity (local, fast)

Embeds the candidate name using `all-MiniLM-L6-v2` via `@xenova/transformers` (384-dim vectors). Runs KNN query via `sqlite-vec` against pre-computed embeddings. Returns top 10 semantically similar packages.

### Step 4 — Risk Scoring (composite)

Combines signals into a single risk level:

- **low** — available, no close string matches, no semantic collisions
- **medium** — available but confusingly similar to popular packages, or taken but likely squatted
- **high** — taken and not squatted, or near-identical to a popular package (typosquat territory)

### Output

Results stored to `runs` + `results` tables in SQLite, then formatted per `--format` flag.

## Data Layer

### Storage

Single SQLite file: `~/.monkeywrench/monkeywrench.db`

### Schema

```sql
-- Package name list (from all-the-package-names)
CREATE TABLE packages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Vector embeddings (sqlite-vec virtual table)
CREATE VIRTUAL TABLE package_embeddings USING vec0(
  id INTEGER PRIMARY KEY,
  embedding float[384]
);

-- Check runs
CREATE TABLE runs (
  id INTEGER PRIMARY KEY,
  timestamp TEXT NOT NULL,
  format TEXT NOT NULL,
  source TEXT NOT NULL  -- 'cli' | 'file'
);

-- Results per run
CREATE TABLE results (
  id INTEGER PRIMARY KEY,
  run_id INTEGER NOT NULL REFERENCES runs(id),
  name TEXT NOT NULL,
  available BOOLEAN,
  squatted BOOLEAN,
  risk_score TEXT NOT NULL,  -- 'low' | 'medium' | 'high'
  string_matches TEXT,       -- JSON array
  semantic_matches TEXT      -- JSON array
);

-- Metadata (sync state, versions)
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Sync Pipeline

1. **First run**: Download pre-built DB from GitHub release (contains 3M+ package names + embeddings)
2. **Subsequent syncs** (`monkeywrench sync`): Pull latest `all-the-package-names`, diff against `packages` table, embed only new names (~1-2k/day), insert
3. `meta.last_sync` tracks freshness — CLI warns if >7 days stale

### Embedding Model

`all-MiniLM-L6-v2` via `@xenova/transformers`. 384-dimension vectors. Runs locally, model cached after first download (~80MB). Pre-built snapshot eliminates the need to embed 3M names locally.

## TUI Dashboard

Default command (`monkeywrench` with no args). Built with kidd's `screen()` and Ink components.

### Layout

- Gradient ASCII logo at top (via `ink-gradient` / `ink-big-text` or hand-crafted with color props)
- **Runs list** — browse past check runs, sorted by date
- **Results view** — drill into a run, see all candidates with scores in a table
- **Detail view** — select a name, see full breakdown (string matches, semantic matches, squatter info, risk explanation)
- **Sorting/filtering** — sort by risk, filter by available-only

## Vercel Skills

Two skills, shipped via `npx skills add`. Scripts handle setup, agent stays thin.

### Skill 1: `think` — Creative Naming Workflow

- `setup.sh` — checks if CLI installed, installs if not, runs `monkeywrench sync` if no DB
- SKILL.md teaches the agent how to think about npm naming: heuristics, patterns, what makes a good name (short, memorable, avoid hyphens when possible, check for unintended meanings)
- Agent generates candidates, calls CLI to score them, interprets results
- Automatically invokes the `check` skill or calls `monkeywrench check` directly

### Skill 2: `check` — Pure Validation

- `setup.sh` — same install/sync check
- SKILL.md is minimal — instructs agent to run `monkeywrench check <names> --format=agent` and interpret the output
- Can be used standalone or called by `think`

### Installation

```
npx skills add zrosenbauer/monkeywrench
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@kidd-cli/core` | CLI framework (commands, screens, Ink UI) |
| `squatter` | npm squatter detection + availability |
| `better-sqlite3` | SQLite driver |
| `sqlite-vec` | Vector search extension for SQLite |
| `@xenova/transformers` | Local text embeddings (all-MiniLM-L6-v2) |
| `cmpstr` | String similarity (Jaro-Winkler, Levenshtein, Dice) |
| `all-the-package-names` | Offline npm package name list |
| `ink-gradient` | Gradient text for TUI logo |
| `ink-big-text` | ASCII big text for TUI logo |

## Build & CI

- **Turborepo** for task orchestration across packages
- **pnpm workspaces** for package management
- **Weekly CI job**: rebuilds the pre-built DB snapshot, attaches to GitHub release
- **Standard CI**: typecheck, lint, test across all packages
