# Namescout

An npm package naming toolkit — generate names, check availability, detect squatters, and run semantic similarity "vibe checks" against the entire npm registry.

## Tech Stack

- **Runtime**: Node.js (TypeScript, ESM)
- **Package Manager**: pnpm (workspaces)
- **Build**: Turborepo + tsdown
- **CLI Framework**: `@kidd-cli/core` (file-system autoloaded commands, Ink TUI)
- **Database**: SQLite (`better-sqlite3`) + `sqlite-vec` (vector search)
- **Embeddings**: `@xenova/transformers` (`all-MiniLM-L6-v2`, 384-dim)
- **String Similarity**: `cmpstr` (Jaro-Winkler)
- **Squatter Detection**: `squatter`
- **Registry Data**: `all-the-package-names` (offline npm name list)

## Monorepo Structure

```
packages/
  types/     → @namescout/types   — shared TypeScript interfaces
  db/        → @namescout/db      — SQLite + sqlite-vec layer
  data/      → @namescout/data    — sync pipeline, embeddings, snapshot download
  core/      → @namescout/core    — check pipeline (squatter → similarity → risk)
  cli/       → namescout (npm)    — kidd CLI + Ink TUI dashboard
skills/
  check/     → Vercel skill for validating package names
  think/     → Vercel skill for creative naming workflow
```

## CLI Commands

```
namescout                              → opens dashboard TUI (default)
namescout check <name> [names...]      → score names, store results
namescout check --file candidates.json → score from file
namescout sync                         → download/update package DB
namescout history                      → list past runs
```

`check` supports `--format=table|agent|json`.

## Data

Single SQLite file at `~/.namescout/namescout.db`. Pre-built snapshot downloaded from GitHub releases on first run. Delta sync for new packages via `all-the-package-names`.

## Conventions

- ESM everywhere (`"type": "module"`)
- `async/await` over callbacks
- CLI entry point is thin — logic in library packages
- Tests alongside source (`*.test.ts`), run with vitest
- Commands go in `packages/cli/src/commands/` (kidd autoloads them)
- Components go in `packages/cli/src/components/`

## Superpowers

<superpowers>

- Write all superpowers output (plans, specs, designs) to `.superpowers/` only
- Never write superpowers files to `docs/`, `docs/superpowers/`, or any other directory
- Plans go in `.superpowers/plans/`
- Specs go in `.superpowers/specs/`

</superpowers>
