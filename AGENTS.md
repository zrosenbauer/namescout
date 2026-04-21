# Monkeywrench

An npm package naming toolkit — generate names, check availability, detect squatters, and run semantic similarity "vibe checks" against the entire npm registry.

## Tech Stack

- **Runtime**: Node.js (TypeScript)
- **Package Manager**: pnpm
- **Database**: SQLite + sqlite-vec (local vector search)
- **Embeddings**: Transformers.js (`all-MiniLM-L6-v2`, 384-dim)
- **String Similarity**: cmpstr (Levenshtein, Jaro-Winkler, Dice-Sorensen)
- **Registry Data**: `all-the-package-names` (offline npm name list)

## Architecture

```
monkeywrench generate <topic>    → AI-powered name generation (shipped as a skill)
monkeywrench check <name>        → availability + squatter detection + vibe check
```

### Core Modules

- **generator** — name generation skill (creative naming from topic/description)
- **checker** — availability lookup against offline npm name list
- **squatter** — heuristics for detecting squatted packages (low downloads, stale, no repo)
- **vibecheck** — semantic similarity via vector search (sqlite-vec) + string similarity (cmpstr)
- **db** — SQLite database management (package names + embeddings)

## Conventions

- Use ESM (`"type": "module"` in package.json)
- Prefer `async/await` over callbacks
- Keep CLI entry point thin — logic lives in library modules
- Tests alongside source files (`*.test.ts`)

## Superpowers

<superpowers>

- Write all superpowers output (plans, specs, designs) to `.superpowers/` only
- Never write superpowers files to `docs/`, `docs/superpowers/`, or any other directory
- Plans go in `.superpowers/plans/`
- Specs go in `.superpowers/specs/`

</superpowers>
