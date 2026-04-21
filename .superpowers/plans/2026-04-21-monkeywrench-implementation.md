# Monkeywrench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a turborepo monorepo npm package naming toolkit with CLI (kidd), SQLite vector search, squatter detection, and Vercel skills.

**Architecture:** Turborepo monorepo with 5 packages (`types`, `db`, `data`, `core`, `cli`) + 2 Vercel skills (`think`, `check`). CLI built on `@kidd-cli/core` with Ink TUI. Data stored in `~/.monkeywrench/monkeywrench.db` (SQLite + sqlite-vec). Pre-built embeddings DB shipped via GitHub releases, delta sync for new packages.

**Tech Stack:** TypeScript, pnpm workspaces, Turborepo, `@kidd-cli/core`, `better-sqlite3`, `sqlite-vec`, `@xenova/transformers`, `cmpstr`, `squatter`, `all-the-package-names`, Ink, React, Zod

---

## Phase 1: Monorepo Scaffold

### Task 1: Initialize Turborepo + pnpm workspace

**Files:**
- Modify: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Update root `package.json`**

```json
{
  "name": "monkeywrench",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 5: Create root `tsconfig.json`**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "references": [
    { "path": "packages/types" },
    { "path": "packages/db" },
    { "path": "packages/data" },
    { "path": "packages/core" },
    { "path": "packages/cli" }
  ]
}
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules/
dist/
.turbo/
*.tsbuildinfo
.env
.env.*
```

- [ ] **Step 7: Create `.npmrc`**

```
auto-install-peers=true
```

- [ ] **Step 8: Install root dependencies**

Run: `pnpm install`
Expected: lockfile generated, turbo installed

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json .gitignore .npmrc pnpm-lock.yaml AGENTS.md CLAUDE.md .superpowers/
git commit -m "feat: initialize turborepo monorepo scaffold"
```

---

### Task 2: Create `@monkeywrench/types` package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/tsdown.config.ts`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@monkeywrench/types",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "tsdown": "^0.12.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/types/tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
})
```

- [ ] **Step 4: Create `packages/types/src/index.ts`**

```ts
// ── Risk Levels ──────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'

// ── Similarity Match ─────────────────────────────────────────────────────────

export interface SimilarityMatch {
  readonly name: string
  readonly score: number
}

// ── Check Result (per candidate name) ────────────────────────────────────────

export interface CheckResult {
  readonly name: string
  readonly available: boolean
  readonly squatted: boolean | null
  readonly riskLevel: RiskLevel
  readonly stringMatches: readonly SimilarityMatch[]
  readonly semanticMatches: readonly SimilarityMatch[]
}

// ── Run (a batch of checks) ──────────────────────────────────────────────────

export interface Run {
  readonly id: number
  readonly timestamp: string
  readonly source: 'cli' | 'file'
  readonly results: readonly CheckResult[]
}

// ── Output Formats ───────────────────────────────────────────────────────────

export type OutputFormat = 'table' | 'agent' | 'json'

// ── Sync Metadata ────────────────────────────────────────────────────────────

export interface SyncMeta {
  readonly lastSync: string | null
  readonly packageCount: number
  readonly snapshotVersion: string | null
}
```

- [ ] **Step 5: Build and verify**

Run: `cd packages/types && pnpm install && pnpm build`
Expected: `dist/` created with `index.js` and `index.d.ts`

- [ ] **Step 6: Commit**

```bash
git add packages/types/
git commit -m "feat: add @monkeywrench/types package with shared interfaces"
```

---

### Task 3: Create `@monkeywrench/db` package

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/tsdown.config.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/connection.ts`
- Create: `packages/db/src/queries.ts`
- Test: `packages/db/src/schema.test.ts`
- Test: `packages/db/src/queries.test.ts`

- [ ] **Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@monkeywrench/db",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@monkeywrench/types": "workspace:*",
    "better-sqlite3": "^11.0.0",
    "sqlite-vec": "^0.1.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "tsdown": "^0.12.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../types" }
  ]
}
```

- [ ] **Step 3: Create `packages/db/tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['better-sqlite3', 'sqlite-vec'],
})
```

- [ ] **Step 4: Create `packages/db/src/connection.ts`**

This module manages the SQLite connection and loads the sqlite-vec extension. The DB file lives at `~/.monkeywrench/monkeywrench.db`.

```ts
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

const DB_DIR = path.join(os.homedir(), '.monkeywrench')
const DB_PATH = path.join(DB_DIR, 'monkeywrench.db')

export function getDbPath(): string {
  return DB_PATH
}

export function openDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? DB_PATH
  const dir = path.dirname(resolvedPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const db = new Database(resolvedPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  sqliteVec.load(db)

  return db
}
```

- [ ] **Step 5: Create `packages/db/src/schema.ts`**

This module creates all tables if they don't exist.

```ts
import type Database from 'better-sqlite3'

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS package_embeddings USING vec0(
      id INTEGER PRIMARY KEY,
      embedding float[384]
    );

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL CHECK (source IN ('cli', 'file'))
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL REFERENCES runs(id),
      name TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 0,
      squatted INTEGER,
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
      string_matches TEXT NOT NULL DEFAULT '[]',
      semantic_matches TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}
```

- [ ] **Step 6: Write test for schema initialization**

Create `packages/db/src/schema.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'
import { initializeSchema } from './schema.js'

function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  sqliteVec.load(db)
  return db
}

describe('initializeSchema', () => {
  let db: Database.Database

  afterEach(() => {
    db?.close()
  })

  it('creates all expected tables', () => {
    db = createTestDb()
    initializeSchema(db)

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row: any) => row.name)

    expect(tables).toContain('packages')
    expect(tables).toContain('runs')
    expect(tables).toContain('results')
    expect(tables).toContain('meta')
  })

  it('is idempotent', () => {
    db = createTestDb()
    initializeSchema(db)
    initializeSchema(db)

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()

    expect(tables.length).toBeGreaterThanOrEqual(4)
  })
})
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/db && pnpm install && pnpm test`
Expected: 2 tests pass

- [ ] **Step 8: Create `packages/db/src/queries.ts`**

```ts
import type Database from 'better-sqlite3'
import type { CheckResult, SimilarityMatch, Run, SyncMeta } from '@monkeywrench/types'

// ── Package Names ────────────────────────────────────────────────────────────

export function insertPackages(db: Database.Database, names: readonly string[]): void {
  const stmt = db.prepare('INSERT OR IGNORE INTO packages (name) VALUES (?)')
  const insertMany = db.transaction((rows: readonly string[]) => {
    for (const name of rows) {
      stmt.run(name)
    }
  })
  insertMany(names)
}

export function getPackageCount(db: Database.Database): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number }
  return row.count
}

export function getPackageNames(db: Database.Database): string[] {
  return db
    .prepare('SELECT name FROM packages ORDER BY name')
    .all()
    .map((row: any) => row.name)
}

export function getPackageNamesNotEmbedded(db: Database.Database): string[] {
  return db
    .prepare(`
      SELECT p.name FROM packages p
      LEFT JOIN package_embeddings e ON p.id = e.id
      WHERE e.id IS NULL
      ORDER BY p.id
    `)
    .all()
    .map((row: any) => row.name)
}

export function getPackageId(db: Database.Database, name: string): number | null {
  const row = db.prepare('SELECT id FROM packages WHERE name = ?').get(name) as { id: number } | undefined
  return row?.id ?? null
}

// ── Embeddings ───────────────────────────────────────────────────────────────

export function insertEmbedding(db: Database.Database, id: number, embedding: Float32Array): void {
  db.prepare('INSERT OR REPLACE INTO package_embeddings (id, embedding) VALUES (?, ?)').run(id, embedding.buffer)
}

export function insertEmbeddings(
  db: Database.Database,
  entries: readonly { id: number; embedding: Float32Array }[]
): void {
  const stmt = db.prepare('INSERT OR REPLACE INTO package_embeddings (id, embedding) VALUES (?, ?)')
  const insertMany = db.transaction((rows: readonly { id: number; embedding: Float32Array }[]) => {
    for (const { id, embedding } of rows) {
      stmt.run(id, embedding.buffer)
    }
  })
  insertMany(entries)
}

export function findSimilarByVector(
  db: Database.Database,
  embedding: Float32Array,
  limit: number = 10
): SimilarityMatch[] {
  const rows = db
    .prepare(`
      SELECT p.name, v.distance
      FROM package_embeddings v
      JOIN packages p ON p.id = v.id
      WHERE v.embedding MATCH ?
      ORDER BY v.distance
      LIMIT ?
    `)
    .all(embedding.buffer, limit) as { name: string; distance: number }[]

  return rows.map((row) => ({
    name: row.name,
    score: 1 - row.distance,
  }))
}

// ── Runs & Results ───────────────────────────────────────────────────────────

export function createRun(db: Database.Database, source: 'cli' | 'file'): number {
  const result = db.prepare('INSERT INTO runs (source) VALUES (?)').run(source)
  return Number(result.lastInsertRowid)
}

export function insertResult(db: Database.Database, runId: number, result: CheckResult): void {
  db.prepare(`
    INSERT INTO results (run_id, name, available, squatted, risk_level, string_matches, semantic_matches)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    runId,
    result.name,
    result.available ? 1 : 0,
    result.squatted === null ? null : result.squatted ? 1 : 0,
    result.riskLevel,
    JSON.stringify(result.stringMatches),
    JSON.stringify(result.semanticMatches),
  )
}

export function getRuns(db: Database.Database, limit: number = 50): Omit<Run, 'results'>[] {
  return db
    .prepare('SELECT id, timestamp, source FROM runs ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as Omit<Run, 'results'>[]
}

export function getRunResults(db: Database.Database, runId: number): CheckResult[] {
  const rows = db
    .prepare('SELECT * FROM results WHERE run_id = ? ORDER BY id')
    .all(runId) as any[]

  return rows.map((row) => ({
    name: row.name,
    available: Boolean(row.available),
    squatted: row.squatted === null ? null : Boolean(row.squatted),
    riskLevel: row.risk_level,
    stringMatches: JSON.parse(row.string_matches),
    semanticMatches: JSON.parse(row.semantic_matches),
  }))
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export function getMeta(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(db: Database.Database, key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value)
}

export function getSyncMeta(db: Database.Database): SyncMeta {
  return {
    lastSync: getMeta(db, 'last_sync'),
    packageCount: getPackageCount(db),
    snapshotVersion: getMeta(db, 'snapshot_version'),
  }
}
```

- [ ] **Step 9: Write tests for queries**

Create `packages/db/src/queries.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'
import { initializeSchema } from './schema.js'
import {
  insertPackages,
  getPackageCount,
  getPackageId,
  createRun,
  insertResult,
  getRuns,
  getRunResults,
  getMeta,
  setMeta,
  getSyncMeta,
} from './queries.js'

function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  sqliteVec.load(db)
  initializeSchema(db)
  return db
}

describe('package queries', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(() => {
    db?.close()
  })

  it('inserts and counts packages', () => {
    insertPackages(db, ['foo', 'bar', 'baz'])
    expect(getPackageCount(db)).toBe(3)
  })

  it('ignores duplicate package names', () => {
    insertPackages(db, ['foo', 'bar'])
    insertPackages(db, ['bar', 'baz'])
    expect(getPackageCount(db)).toBe(3)
  })

  it('gets package id by name', () => {
    insertPackages(db, ['foo'])
    const id = getPackageId(db, 'foo')
    expect(id).toBe(1)
  })

  it('returns null for unknown package', () => {
    expect(getPackageId(db, 'nonexistent')).toBeNull()
  })
})

describe('run and result queries', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(() => {
    db?.close()
  })

  it('creates a run and stores results', () => {
    const runId = createRun(db, 'cli')
    expect(runId).toBe(1)

    insertResult(db, runId, {
      name: 'fetchcraft',
      available: true,
      squatted: null,
      riskLevel: 'low',
      stringMatches: [{ name: 'fetch', score: 0.8 }],
      semanticMatches: [{ name: 'http-get', score: 0.7 }],
    })

    const runs = getRuns(db)
    expect(runs).toHaveLength(1)
    expect(runs[0]!.source).toBe('cli')

    const results = getRunResults(db, runId)
    expect(results).toHaveLength(1)
    expect(results[0]!.name).toBe('fetchcraft')
    expect(results[0]!.available).toBe(true)
    expect(results[0]!.squatted).toBeNull()
    expect(results[0]!.stringMatches).toEqual([{ name: 'fetch', score: 0.8 }])
  })
})

describe('meta queries', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(() => {
    db?.close()
  })

  it('gets and sets meta', () => {
    setMeta(db, 'last_sync', '2026-04-21')
    expect(getMeta(db, 'last_sync')).toBe('2026-04-21')
  })

  it('returns null for missing meta', () => {
    expect(getMeta(db, 'nonexistent')).toBeNull()
  })

  it('returns sync meta summary', () => {
    insertPackages(db, ['a', 'b', 'c'])
    setMeta(db, 'last_sync', '2026-04-21')
    setMeta(db, 'snapshot_version', 'v0.1.0')

    const meta = getSyncMeta(db)
    expect(meta.lastSync).toBe('2026-04-21')
    expect(meta.packageCount).toBe(3)
    expect(meta.snapshotVersion).toBe('v0.1.0')
  })
})
```

- [ ] **Step 10: Run tests**

Run: `cd packages/db && pnpm test`
Expected: All tests pass

- [ ] **Step 11: Create `packages/db/src/index.ts`**

```ts
export { openDatabase, getDbPath } from './connection.js'
export { initializeSchema } from './schema.js'
export {
  insertPackages,
  getPackageCount,
  getPackageNames,
  getPackageNamesNotEmbedded,
  getPackageId,
  insertEmbedding,
  insertEmbeddings,
  findSimilarByVector,
  createRun,
  insertResult,
  getRuns,
  getRunResults,
  getMeta,
  setMeta,
  getSyncMeta,
} from './queries.js'
```

- [ ] **Step 12: Build and verify**

Run: `cd packages/db && pnpm build`
Expected: `dist/` created with all modules

- [ ] **Step 13: Commit**

```bash
git add packages/db/
git commit -m "feat: add @monkeywrench/db package with SQLite + sqlite-vec"
```

---

### Task 4: Create `@monkeywrench/data` package

**Files:**
- Create: `packages/data/package.json`
- Create: `packages/data/tsconfig.json`
- Create: `packages/data/tsdown.config.ts`
- Create: `packages/data/src/index.ts`
- Create: `packages/data/src/sync.ts`
- Create: `packages/data/src/embed.ts`
- Create: `packages/data/src/snapshot.ts`
- Test: `packages/data/src/embed.test.ts`

- [ ] **Step 1: Create `packages/data/package.json`**

```json
{
  "name": "@monkeywrench/data",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@monkeywrench/db": "workspace:*",
    "@monkeywrench/types": "workspace:*",
    "@xenova/transformers": "^2.17.0",
    "all-the-package-names": "^2.0.0"
  },
  "devDependencies": {
    "tsdown": "^0.12.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/data/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../types" },
    { "path": "../db" }
  ]
}
```

- [ ] **Step 3: Create `packages/data/tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['better-sqlite3', 'sqlite-vec', '@xenova/transformers', 'all-the-package-names'],
})
```

- [ ] **Step 4: Create `packages/data/src/embed.ts`**

```ts
import type { Pipeline } from '@xenova/transformers'

let extractor: Pipeline | null = null

export async function getEmbedder(): Promise<Pipeline> {
  if (extractor) return extractor

  const { pipeline } = await import('@xenova/transformers')
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return extractor
}

export async function embedText(text: string): Promise<Float32Array> {
  const model = await getEmbedder()
  const output = await model(text, { pooling: 'mean', normalize: true })
  return new Float32Array(output.data)
}

export async function embedBatch(texts: readonly string[], batchSize: number = 64): Promise<Float32Array[]> {
  const model = await getEmbedder()
  const results: Float32Array[] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const outputs = await Promise.all(
      batch.map(async (text) => {
        const output = await model(text, { pooling: 'mean', normalize: true })
        return new Float32Array(output.data)
      })
    )
    results.push(...outputs)
  }

  return results
}
```

- [ ] **Step 5: Create `packages/data/src/snapshot.ts`**

Handles downloading the pre-built DB from GitHub releases and checking for updates.

```ts
import fs from 'node:fs'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { getDbPath } from '@monkeywrench/db'

const REPO = 'zrosenbauer/monkeywrench'

export interface SnapshotInfo {
  readonly version: string
  readonly downloadUrl: string
}

export async function getLatestSnapshot(): Promise<SnapshotInfo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!response.ok) return null

    const release = (await response.json()) as { tag_name: string; assets: { name: string; browser_download_url: string }[] }
    const asset = release.assets.find((a) => a.name === 'monkeywrench.db')
    if (!asset) return null

    return {
      version: release.tag_name,
      downloadUrl: asset.browser_download_url,
    }
  } catch {
    return null
  }
}

export async function downloadSnapshot(url: string, destPath?: string): Promise<void> {
  const dbPath = destPath ?? getDbPath()
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download snapshot: ${response.status}`)
  }

  const fileStream = createWriteStream(dbPath)
  await pipeline(response.body as any, fileStream)
}

export function hasLocalDatabase(dbPath?: string): boolean {
  return fs.existsSync(dbPath ?? getDbPath())
}
```

- [ ] **Step 6: Create `packages/data/src/sync.ts`**

Orchestrates: load names from `all-the-package-names`, diff against DB, embed new packages.

```ts
import type Database from 'better-sqlite3'
import {
  insertPackages,
  getPackageCount,
  getPackageNamesNotEmbedded,
  getPackageId,
  insertEmbeddings,
  setMeta,
} from '@monkeywrench/db'
import { embedBatch } from './embed.js'

export interface SyncProgress {
  phase: 'loading-names' | 'inserting-names' | 'embedding' | 'done'
  total: number
  current: number
}

export type SyncProgressCallback = (progress: SyncProgress) => void

export async function syncPackageNames(
  db: Database.Database,
  onProgress?: SyncProgressCallback
): Promise<{ added: number }> {
  onProgress?.({ phase: 'loading-names', total: 0, current: 0 })

  const allNames: string[] = (await import('all-the-package-names')).default
  const beforeCount = getPackageCount(db)

  onProgress?.({ phase: 'inserting-names', total: allNames.length, current: 0 })

  // Insert in batches of 10k for progress reporting
  const BATCH = 10_000
  for (let i = 0; i < allNames.length; i += BATCH) {
    insertPackages(db, allNames.slice(i, i + BATCH))
    onProgress?.({ phase: 'inserting-names', total: allNames.length, current: Math.min(i + BATCH, allNames.length) })
  }

  const afterCount = getPackageCount(db)
  const added = afterCount - beforeCount

  setMeta(db, 'last_sync', new Date().toISOString())

  return { added }
}

export async function embedNewPackages(
  db: Database.Database,
  onProgress?: SyncProgressCallback
): Promise<{ embedded: number }> {
  const unembedded = getPackageNamesNotEmbedded(db)

  if (unembedded.length === 0) {
    onProgress?.({ phase: 'done', total: 0, current: 0 })
    return { embedded: 0 }
  }

  const BATCH = 100
  let embedded = 0

  for (let i = 0; i < unembedded.length; i += BATCH) {
    const batch = unembedded.slice(i, i + BATCH)
    onProgress?.({ phase: 'embedding', total: unembedded.length, current: i })

    const vectors = await embedBatch(batch)

    const entries = batch.map((name, idx) => {
      const id = getPackageId(db, name)
      if (id === null) throw new Error(`Package not found: ${name}`)
      return { id, embedding: vectors[idx]! }
    })

    insertEmbeddings(db, entries)
    embedded += batch.length
  }

  onProgress?.({ phase: 'done', total: unembedded.length, current: unembedded.length })
  return { embedded }
}
```

- [ ] **Step 7: Write test for embed module**

Create `packages/data/src/embed.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { embedText } from './embed.js'

describe('embedText', () => {
  it('returns a 384-dim Float32Array', async () => {
    const embedding = await embedText('react')
    expect(embedding).toBeInstanceOf(Float32Array)
    expect(embedding.length).toBe(384)
  }, 30_000)

  it('produces different embeddings for different terms', async () => {
    const a = await embedText('react')
    const b = await embedText('database')
    expect(a).not.toEqual(b)
  }, 30_000)
})
```

- [ ] **Step 8: Run tests**

Run: `cd packages/data && pnpm install && pnpm test`
Expected: Tests pass (first run downloads model, may take up to 30s)

- [ ] **Step 9: Create `packages/data/src/index.ts`**

```ts
export { embedText, embedBatch, getEmbedder } from './embed.js'
export { syncPackageNames, embedNewPackages } from './sync.js'
export type { SyncProgress, SyncProgressCallback } from './sync.js'
export { getLatestSnapshot, downloadSnapshot, hasLocalDatabase } from './snapshot.js'
export type { SnapshotInfo } from './snapshot.js'
```

- [ ] **Step 10: Build and verify**

Run: `cd packages/data && pnpm build`
Expected: `dist/` created

- [ ] **Step 11: Commit**

```bash
git add packages/data/
git commit -m "feat: add @monkeywrench/data package with sync and embedding pipeline"
```

---

### Task 5: Create `@monkeywrench/core` package

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsdown.config.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/pipeline.ts`
- Create: `packages/core/src/squatter.ts`
- Create: `packages/core/src/similarity.ts`
- Create: `packages/core/src/risk.ts`
- Create: `packages/core/src/format.ts`
- Test: `packages/core/src/risk.test.ts`
- Test: `packages/core/src/format.test.ts`

- [ ] **Step 1: Create `packages/core/package.json`**

```json
{
  "name": "@monkeywrench/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@monkeywrench/db": "workspace:*",
    "@monkeywrench/data": "workspace:*",
    "@monkeywrench/types": "workspace:*",
    "cmpstr": "^2.0.0",
    "squatter": "^1.0.0"
  },
  "devDependencies": {
    "tsdown": "^0.12.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../types" },
    { "path": "../db" },
    { "path": "../data" }
  ]
}
```

- [ ] **Step 3: Create `packages/core/tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['better-sqlite3', 'sqlite-vec', '@xenova/transformers', 'squatter', 'cmpstr'],
})
```

- [ ] **Step 4: Create `packages/core/src/squatter.ts`**

Wraps the `squatter` package, handling the case where a package doesn't exist.

```ts
export interface SquatterResult {
  readonly exists: boolean
  readonly squatted: boolean | null
}

export async function checkSquatter(name: string): Promise<SquatterResult> {
  try {
    const squatter = (await import('squatter')).default
    const isSquatted = await squatter(name)
    return { exists: true, squatted: isSquatted }
  } catch (error: any) {
    // If the package doesn't exist, squatter throws a 404
    if (error?.code === 'PackageNotFoundError' || error?.message?.includes('404') || error?.statusCode === 404) {
      return { exists: false, squatted: null }
    }
    throw error
  }
}

export async function checkSquatterBatch(
  names: readonly string[]
): Promise<Map<string, SquatterResult>> {
  const results = new Map<string, SquatterResult>()

  // Run in parallel with concurrency limit
  const CONCURRENCY = 5
  for (let i = 0; i < names.length; i += CONCURRENCY) {
    const batch = names.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(async (name) => ({
        name,
        result: await checkSquatter(name),
      }))
    )
    for (const { name, result } of batchResults) {
      results.set(name, result)
    }
  }

  return results
}
```

- [ ] **Step 5: Create `packages/core/src/similarity.ts`**

String similarity using `cmpstr` against the SQLite package list.

```ts
import type Database from 'better-sqlite3'
import type { SimilarityMatch } from '@monkeywrench/types'
import { findSimilarByVector } from '@monkeywrench/db'
import { embedText } from '@monkeywrench/data'

export async function findStringSimilar(
  db: Database.Database,
  name: string,
  limit: number = 10
): Promise<SimilarityMatch[]> {
  // Query a broad set of candidates using SQL LIKE for prefix/substring, then rank with cmpstr
  const candidates = db
    .prepare(`
      SELECT name FROM packages
      WHERE name LIKE ? OR name LIKE ? OR name LIKE ?
      LIMIT 500
    `)
    .all(`${name}%`, `%${name}%`, `%${name.slice(0, 3)}%`)
    .map((row: any) => row.name as string)

  if (candidates.length === 0) return []

  const { CmpStr } = await import('cmpstr')
  const cmp = new CmpStr(name, candidates)
  const ranked = cmp.similarity('jaroWinkler')

  return ranked
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((match: any) => ({
      name: match.target,
      score: match.similarity,
    }))
}

export async function findSemanticSimilar(
  db: Database.Database,
  name: string,
  limit: number = 10
): Promise<SimilarityMatch[]> {
  const embedding = await embedText(name)
  return findSimilarByVector(db, embedding, limit)
}
```

- [ ] **Step 6: Create `packages/core/src/risk.ts`**

```ts
import type { RiskLevel, SimilarityMatch } from '@monkeywrench/types'

interface RiskInput {
  readonly available: boolean
  readonly squatted: boolean | null
  readonly stringMatches: readonly SimilarityMatch[]
  readonly semanticMatches: readonly SimilarityMatch[]
}

export function computeRisk(input: RiskInput): RiskLevel {
  const { available, squatted, stringMatches, semanticMatches } = input

  // Taken and not squatted = high risk
  if (!available && !squatted) {
    return 'high'
  }

  // Very close string match to an existing package
  const topStringScore = stringMatches[0]?.score ?? 0
  if (topStringScore > 0.92) {
    return 'high'
  }

  // Very close semantic match
  const topSemanticScore = semanticMatches[0]?.score ?? 0
  if (topSemanticScore > 0.9) {
    return 'high'
  }

  // Taken but squatted = medium (disputable)
  if (!available && squatted) {
    return 'medium'
  }

  // Moderately similar to existing packages
  if (topStringScore > 0.8 || topSemanticScore > 0.8) {
    return 'medium'
  }

  return 'low'
}
```

- [ ] **Step 7: Write test for risk scoring**

Create `packages/core/src/risk.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeRisk } from './risk.js'

describe('computeRisk', () => {
  it('returns high when taken and not squatted', () => {
    expect(computeRisk({
      available: false,
      squatted: false,
      stringMatches: [],
      semanticMatches: [],
    })).toBe('high')
  })

  it('returns high when very close string match exists', () => {
    expect(computeRisk({
      available: true,
      squatted: null,
      stringMatches: [{ name: 'react', score: 0.95 }],
      semanticMatches: [],
    })).toBe('high')
  })

  it('returns medium when taken but squatted', () => {
    expect(computeRisk({
      available: false,
      squatted: true,
      stringMatches: [{ name: 'foo', score: 0.5 }],
      semanticMatches: [],
    })).toBe('medium')
  })

  it('returns medium when moderately similar', () => {
    expect(computeRisk({
      available: true,
      squatted: null,
      stringMatches: [{ name: 'fetchify', score: 0.85 }],
      semanticMatches: [],
    })).toBe('medium')
  })

  it('returns low when available and no close matches', () => {
    expect(computeRisk({
      available: true,
      squatted: null,
      stringMatches: [{ name: 'unrelated', score: 0.3 }],
      semanticMatches: [{ name: 'other', score: 0.4 }],
    })).toBe('low')
  })

  it('returns low when no matches at all', () => {
    expect(computeRisk({
      available: true,
      squatted: null,
      stringMatches: [],
      semanticMatches: [],
    })).toBe('low')
  })
})
```

- [ ] **Step 8: Run risk tests**

Run: `cd packages/core && pnpm install && pnpm test`
Expected: All 6 tests pass

- [ ] **Step 9: Create `packages/core/src/format.ts`**

```ts
import type { CheckResult, Run } from '@monkeywrench/types'

export function formatTable(results: readonly CheckResult[]): string {
  const header = '| Name | Available | Squatted | Risk | Top Match |'
  const sep = '|------|-----------|----------|------|-----------|'
  const rows = results.map((r) => {
    const avail = r.available ? 'yes' : 'no'
    const squat = r.squatted === null ? '-' : r.squatted ? 'likely' : 'no'
    const topMatch = r.stringMatches[0]?.name ?? '-'
    return `| ${r.name} | ${avail} | ${squat} | ${r.riskLevel} | ${topMatch} |`
  })

  return [header, sep, ...rows].join('\n')
}

export function formatAgent(results: readonly CheckResult[]): string {
  const lines = results.map((r) => {
    const status = r.available ? 'AVAILABLE' : r.squatted ? 'SQUATTED' : 'TAKEN'
    const risk = r.riskLevel.toUpperCase()
    const similar = r.stringMatches
      .slice(0, 3)
      .map((m) => m.name)
      .join(', ')
    return `- **${r.name}** [${status}] risk:${risk}${similar ? ` similar:[${similar}]` : ''}`
  })

  return lines.join('\n')
}

export function formatJson(results: readonly CheckResult[]): string {
  return JSON.stringify(results, null, 2)
}
```

- [ ] **Step 10: Write test for formatters**

Create `packages/core/src/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatTable, formatAgent, formatJson } from './format.js'
import type { CheckResult } from '@monkeywrench/types'

const MOCK_RESULTS: CheckResult[] = [
  {
    name: 'fetchcraft',
    available: true,
    squatted: null,
    riskLevel: 'low',
    stringMatches: [{ name: 'fetch', score: 0.8 }],
    semanticMatches: [{ name: 'http-get', score: 0.7 }],
  },
  {
    name: 'reqwest',
    available: false,
    squatted: true,
    riskLevel: 'medium',
    stringMatches: [{ name: 'request', score: 0.9 }],
    semanticMatches: [],
  },
]

describe('formatTable', () => {
  it('produces a markdown table', () => {
    const table = formatTable(MOCK_RESULTS)
    expect(table).toContain('| fetchcraft |')
    expect(table).toContain('| reqwest |')
    expect(table).toContain('| Name |')
  })
})

describe('formatAgent', () => {
  it('produces compressed markdown', () => {
    const output = formatAgent(MOCK_RESULTS)
    expect(output).toContain('**fetchcraft** [AVAILABLE] risk:LOW')
    expect(output).toContain('**reqwest** [SQUATTED] risk:MEDIUM')
  })
})

describe('formatJson', () => {
  it('produces valid JSON', () => {
    const output = formatJson(MOCK_RESULTS)
    const parsed = JSON.parse(output)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].name).toBe('fetchcraft')
  })
})
```

- [ ] **Step 11: Run format tests**

Run: `cd packages/core && pnpm test`
Expected: All tests pass

- [ ] **Step 12: Create `packages/core/src/pipeline.ts`**

The main orchestrator that runs all check steps.

```ts
import type Database from 'better-sqlite3'
import type { CheckResult, OutputFormat } from '@monkeywrench/types'
import { createRun, insertResult } from '@monkeywrench/db'
import { checkSquatterBatch } from './squatter.js'
import { findStringSimilar, findSemanticSimilar } from './similarity.js'
import { computeRisk } from './risk.js'
import { formatTable, formatAgent, formatJson } from './format.js'

export interface CheckOptions {
  readonly names: readonly string[]
  readonly source: 'cli' | 'file'
  readonly format: OutputFormat
}

export interface CheckOutput {
  readonly runId: number
  readonly results: readonly CheckResult[]
  readonly formatted: string
}

export async function runCheck(db: Database.Database, options: CheckOptions): Promise<CheckOutput> {
  const { names, source, format } = options

  // Step 1: Squatter detection (network)
  const squatterResults = await checkSquatterBatch(names)

  // Steps 2-4: For each name, compute similarity + risk
  const results: CheckResult[] = []

  for (const name of names) {
    const squat = squatterResults.get(name)!

    const stringMatches = await findStringSimilar(db, name)
    const semanticMatches = await findSemanticSimilar(db, name)

    const riskLevel = computeRisk({
      available: !squat.exists,
      squatted: squat.squatted,
      stringMatches,
      semanticMatches,
    })

    results.push({
      name,
      available: !squat.exists,
      squatted: squat.squatted,
      riskLevel,
      stringMatches,
      semanticMatches,
    })
  }

  // Store results
  const runId = createRun(db, source)
  for (const result of results) {
    insertResult(db, runId, result)
  }

  // Format output
  let formatted: string
  switch (format) {
    case 'table':
      formatted = formatTable(results)
      break
    case 'agent':
      formatted = formatAgent(results)
      break
    case 'json':
      formatted = formatJson(results)
      break
  }

  return { runId, results, formatted }
}
```

- [ ] **Step 13: Create `packages/core/src/index.ts`**

```ts
export { runCheck } from './pipeline.js'
export type { CheckOptions, CheckOutput } from './pipeline.js'
export { checkSquatter, checkSquatterBatch } from './squatter.js'
export { findStringSimilar, findSemanticSimilar } from './similarity.js'
export { computeRisk } from './risk.js'
export { formatTable, formatAgent, formatJson } from './format.js'
```

- [ ] **Step 14: Build and verify**

Run: `cd packages/core && pnpm build`
Expected: `dist/` created

- [ ] **Step 15: Commit**

```bash
git add packages/core/
git commit -m "feat: add @monkeywrench/core package with check pipeline"
```

---

## Phase 2: CLI + TUI

### Task 6: Create `@monkeywrench/cli` package scaffold

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/kidd.config.ts`
- Create: `packages/cli/src/index.ts`

- [ ] **Step 1: Create `packages/cli/package.json`**

```json
{
  "name": "@monkeywrench/cli",
  "version": "0.0.1",
  "type": "module",
  "bin": {
    "monkeywrench": "./dist/index.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "dev": "kidd dev",
    "build": "kidd build",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@kidd-cli/core": "^0.23.0",
    "@monkeywrench/core": "workspace:*",
    "@monkeywrench/data": "workspace:*",
    "@monkeywrench/db": "workspace:*",
    "@monkeywrench/types": "workspace:*",
    "ink": "^7.0.0",
    "ink-gradient": "^3.0.0",
    "ink-big-text": "^2.0.0",
    "react": "^19.2.0",
    "ts-pattern": "^5.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@kidd-cli/cli": "^0.23.0",
    "@types/react": "^19.2.0",
    "tsdown": "^0.12.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 2: Create `packages/cli/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "references": [
    { "path": "../types" },
    { "path": "../db" },
    { "path": "../data" },
    { "path": "../core" }
  ]
}
```

- [ ] **Step 3: Create `packages/cli/kidd.config.ts`**

```ts
import { defineConfig } from '@kidd-cli/core'

export default defineConfig({
  build: { out: './dist' },
  commands: './src/commands',
  compile: true,
  entry: './src/index.ts',
})
```

- [ ] **Step 4: Create `packages/cli/src/index.ts`**

```ts
import { cli } from '@kidd-cli/core'

cli({
  description: 'npm package naming toolkit — generate, check, and score package names',
  help: { header: 'monkeywrench - wrench the perfect name from npm' },
  name: 'monkeywrench',
  version: '0.0.1',
})
```

- [ ] **Step 5: Install dependencies and verify**

Run: `cd packages/cli && pnpm install`
Expected: All dependencies resolved

- [ ] **Step 6: Commit**

```bash
git add packages/cli/
git commit -m "feat: add @monkeywrench/cli package scaffold with kidd"
```

---

### Task 7: Implement `check` command

**Files:**
- Create: `packages/cli/src/commands/check.ts`
- Create: `packages/cli/src/lib/ensure-db.ts`

- [ ] **Step 1: Create `packages/cli/src/lib/ensure-db.ts`**

Helper that opens the DB, initializes schema, and triggers sync if needed.

```ts
import type Database from 'better-sqlite3'
import { openDatabase, initializeSchema, getSyncMeta } from '@monkeywrench/db'
import { hasLocalDatabase, downloadSnapshot, getLatestSnapshot, syncPackageNames, embedNewPackages } from '@monkeywrench/data'

export async function ensureDatabase(): Promise<Database.Database> {
  if (!hasLocalDatabase()) {
    // Try downloading snapshot first
    const snapshot = await getLatestSnapshot()
    if (snapshot) {
      console.log('Downloading package database...')
      await downloadSnapshot(snapshot.downloadUrl)
      console.log('Download complete.')
    }
  }

  const db = openDatabase()
  initializeSchema(db)

  const meta = getSyncMeta(db)

  // If DB is empty or stale (>7 days), sync
  if (meta.packageCount === 0) {
    console.log('Syncing package names...')
    const { added } = await syncPackageNames(db)
    console.log(`Added ${added} packages.`)

    console.log('Generating embeddings for new packages...')
    const { embedded } = await embedNewPackages(db)
    console.log(`Embedded ${embedded} packages.`)
  } else if (meta.lastSync) {
    const daysSinceSync = (Date.now() - new Date(meta.lastSync).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSync > 7) {
      console.warn('Package database is over 7 days old. Run `monkeywrench sync` to update.')
    }
  }

  return db
}
```

- [ ] **Step 2: Create `packages/cli/src/commands/check.ts`**

```ts
import { command } from '@kidd-cli/core'
import { z } from 'zod'
import { runCheck } from '@monkeywrench/core'
import type { OutputFormat } from '@monkeywrench/types'
import { ensureDatabase } from '../lib/ensure-db.js'
import fs from 'node:fs'

const positionals = z.object({
  names: z.array(z.string()).describe('Package names to check'),
})

const options = z.object({
  file: z.string().optional().describe('JSON file with candidate names'),
  format: z.enum(['table', 'agent', 'json']).default('table').describe('Output format'),
})

export default command({
  description: 'Check package name availability, squatter status, and similarity',
  positionals,
  options,
  async handler(ctx) {
    let names: string[] = [...ctx.args.names]

    if (ctx.args.file) {
      const content = fs.readFileSync(ctx.args.file, 'utf-8')
      const parsed = JSON.parse(content)
      const fileNames = Array.isArray(parsed) ? parsed : parsed.names
      names.push(...fileNames)
    }

    if (names.length === 0) {
      ctx.log.error('No names provided. Pass names as arguments or use --file.')
      process.exit(1)
    }

    const db = await ensureDatabase()

    try {
      const { formatted } = await runCheck(db, {
        names,
        source: ctx.args.file ? 'file' : 'cli',
        format: ctx.args.format as OutputFormat,
      })

      ctx.log.raw(formatted)
    } finally {
      db.close()
    }
  },
})
```

- [ ] **Step 3: Test the command manually**

Run: `cd packages/cli && pnpm dev -- check testname123 --format=json`
Expected: JSON output with check results for "testname123"

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/check.ts packages/cli/src/lib/ensure-db.ts
git commit -m "feat: add check command with format options"
```

---

### Task 8: Implement `sync` command

**Files:**
- Create: `packages/cli/src/commands/sync.ts`

- [ ] **Step 1: Create `packages/cli/src/commands/sync.ts`**

```ts
import { command } from '@kidd-cli/core'
import { openDatabase, initializeSchema, getSyncMeta } from '@monkeywrench/db'
import {
  syncPackageNames,
  embedNewPackages,
  hasLocalDatabase,
  getLatestSnapshot,
  downloadSnapshot,
} from '@monkeywrench/data'

export default command({
  description: 'Download or update the package name database',
  async handler(ctx) {
    if (!hasLocalDatabase()) {
      const snapshot = await getLatestSnapshot()
      if (snapshot) {
        ctx.log.info(`Downloading snapshot ${snapshot.version}...`)
        await downloadSnapshot(snapshot.downloadUrl)
        ctx.log.info('Snapshot downloaded.')
      }
    }

    const db = openDatabase()
    initializeSchema(db)

    try {
      ctx.log.info('Syncing package names...')
      const { added } = await syncPackageNames(db, (progress) => {
        if (progress.phase === 'inserting-names' && progress.current > 0) {
          process.stderr.write(`\r  Inserting: ${progress.current}/${progress.total}`)
        }
      })
      console.error('') // newline after progress
      ctx.log.info(`Sync complete. ${added} new packages added.`)

      ctx.log.info('Embedding new packages...')
      const { embedded } = await embedNewPackages(db, (progress) => {
        if (progress.phase === 'embedding' && progress.current > 0) {
          process.stderr.write(`\r  Embedding: ${progress.current}/${progress.total}`)
        }
      })
      console.error('') // newline after progress
      ctx.log.info(`Done. ${embedded} new embeddings generated.`)

      const meta = getSyncMeta(db)
      ctx.log.info(`Total packages: ${meta.packageCount}`)
    } finally {
      db.close()
    }
  },
})
```

- [ ] **Step 2: Test manually**

Run: `cd packages/cli && pnpm dev -- sync`
Expected: Syncs package names, outputs progress

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/commands/sync.ts
git commit -m "feat: add sync command"
```

---

### Task 9: Implement `history` command

**Files:**
- Create: `packages/cli/src/commands/history.ts`

- [ ] **Step 1: Create `packages/cli/src/commands/history.ts`**

```ts
import { command } from '@kidd-cli/core'
import { openDatabase, initializeSchema, getRuns, getRunResults } from '@monkeywrench/db'

export default command({
  description: 'List past check runs',
  async handler(ctx) {
    const db = openDatabase()
    initializeSchema(db)

    try {
      const runs = getRuns(db)

      if (runs.length === 0) {
        ctx.log.info('No runs yet. Use `monkeywrench check` to check some names.')
        return
      }

      const rows = runs.map((run) => {
        const results = getRunResults(db, run.id)
        const available = results.filter((r) => r.available).length
        return {
          ID: run.id,
          Date: run.timestamp,
          Source: run.source,
          Names: results.length,
          Available: `${available}/${results.length}`,
        }
      })

      ctx.log.raw(ctx.format.table(rows))
    } finally {
      db.close()
    }
  },
})
```

- [ ] **Step 2: Test manually**

Run: `cd packages/cli && pnpm dev -- history`
Expected: Table of past runs (or "No runs yet" message)

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/commands/history.ts
git commit -m "feat: add history command"
```

---

### Task 10: Implement `dashboard` TUI screen (default command)

**Files:**
- Create: `packages/cli/src/commands/dashboard.tsx`
- Create: `packages/cli/src/components/logo.tsx`
- Create: `packages/cli/src/components/run-list.tsx`
- Create: `packages/cli/src/components/result-table.tsx`
- Create: `packages/cli/src/components/detail-view.tsx`
- Create: `packages/cli/src/components/status-bar.tsx`

- [ ] **Step 1: Create `packages/cli/src/components/logo.tsx`**

Gradient ASCII logo for the top of the dashboard.

```tsx
import React from 'react'
import { Box, Text } from '@kidd-cli/core/ui'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'

export function Logo(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient name="vice">
        <BigText text="monkeywrench" font="tiny" />
      </Gradient>
      <Text color="gray">npm package naming toolkit</Text>
    </Box>
  )
}
```

- [ ] **Step 2: Create `packages/cli/src/components/status-bar.tsx`**

```tsx
import React from 'react'
import { Box, Text } from '@kidd-cli/core/ui'

interface StatusBarProps {
  readonly view: string
}

const HINTS: Record<string, string> = {
  runs: 'arrows: navigate | enter: select | q: quit',
  results: 'arrows: navigate | enter: detail | b: back | q: quit',
  detail: 'b: back | q: quit',
}

export function StatusBar({ view }: StatusBarProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color="gray">{HINTS[view] ?? 'q: quit'}</Text>
    </Box>
  )
}
```

- [ ] **Step 3: Create `packages/cli/src/components/run-list.tsx`**

```tsx
import React from 'react'
import { Box, Select, Text } from '@kidd-cli/core/ui'
import type { Run } from '@monkeywrench/types'

interface RunListProps {
  readonly runs: readonly Omit<Run, 'results'>[]
  readonly resultCounts: readonly { total: number; available: number }[]
  readonly onSelect: (runId: string) => void
}

export function RunList({ runs, resultCounts, onSelect }: RunListProps): React.ReactElement {
  if (runs.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray">No runs yet. Use `monkeywrench check` to get started.</Text>
      </Box>
    )
  }

  const options = runs.map((run, i) => {
    const counts = resultCounts[i]!
    return {
      label: `${run.timestamp} [${run.source}] — ${counts.available}/${counts.total} available`,
      value: String(run.id),
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Past Runs</Text>
      <Select options={options} onSubmit={onSelect} />
    </Box>
  )
}
```

- [ ] **Step 4: Create `packages/cli/src/components/result-table.tsx`**

```tsx
import React from 'react'
import { Box, Select, Text } from '@kidd-cli/core/ui'
import type { CheckResult } from '@monkeywrench/types'

interface ResultTableProps {
  readonly results: readonly CheckResult[]
  readonly onSelect: (index: string) => void
}

function riskColor(risk: string): string {
  switch (risk) {
    case 'low': return 'green'
    case 'medium': return 'yellow'
    case 'high': return 'red'
    default: return 'white'
  }
}

export function ResultTable({ results, onSelect }: ResultTableProps): React.ReactElement {
  const options = results.map((r, i) => {
    const avail = r.available ? '✓' : '✗'
    const squat = r.squatted === null ? '' : r.squatted ? ' (squatted)' : ''
    return {
      label: `${avail} ${r.name} — ${r.riskLevel} risk${squat}`,
      value: String(i),
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Results</Text>
      <Box gap={2} marginBottom={1}>
        <Text color="green">✓ available</Text>
        <Text color="red">✗ taken</Text>
      </Box>
      <Select options={options} onSubmit={onSelect} />
    </Box>
  )
}
```

- [ ] **Step 5: Create `packages/cli/src/components/detail-view.tsx`**

```tsx
import React from 'react'
import { Box, Text } from '@kidd-cli/core/ui'
import type { CheckResult } from '@monkeywrench/types'

interface DetailViewProps {
  readonly result: CheckResult
}

export function DetailView({ result }: DetailViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>{result.name}</Text>

      <Box gap={2}>
        <Text>Available: <Text color={result.available ? 'green' : 'red'}>{result.available ? 'yes' : 'no'}</Text></Text>
        <Text>Squatted: <Text>{result.squatted === null ? '-' : result.squatted ? 'likely' : 'no'}</Text></Text>
        <Text>Risk: <Text color={result.riskLevel === 'low' ? 'green' : result.riskLevel === 'medium' ? 'yellow' : 'red'}>{result.riskLevel}</Text></Text>
      </Box>

      {result.stringMatches.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Similar Names (string)</Text>
          {result.stringMatches.slice(0, 5).map((m) => (
            <Text key={m.name}>  {m.name} ({(m.score * 100).toFixed(0)}%)</Text>
          ))}
        </Box>
      )}

      {result.semanticMatches.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Similar Names (semantic)</Text>
          {result.semanticMatches.slice(0, 5).map((m) => (
            <Text key={m.name}>  {m.name} ({(m.score * 100).toFixed(0)}%)</Text>
          ))}
        </Box>
      )}

      <Text color="gray">Press b to go back</Text>
    </Box>
  )
}
```

- [ ] **Step 6: Create `packages/cli/src/commands/dashboard.tsx`**

This is the default command (no subcommand). It opens the fullscreen TUI.

```tsx
import {
  Box,
  screen,
  useApp,
  useInput,
} from '@kidd-cli/core/ui'
import React, { useState, useEffect } from 'react'
import { match } from 'ts-pattern'
import { openDatabase, initializeSchema, getRuns, getRunResults } from '@monkeywrench/db'
import type { CheckResult, Run } from '@monkeywrench/types'
import { Logo } from '../components/logo.js'
import { StatusBar } from '../components/status-bar.js'
import { RunList } from '../components/run-list.js'
import { ResultTable } from '../components/result-table.js'
import { DetailView } from '../components/detail-view.js'

type View = 'runs' | 'results' | 'detail'

function Dashboard(): React.ReactElement {
  const { exit } = useApp()
  const [view, setView] = useState<View>('runs')
  const [runs, setRuns] = useState<Omit<Run, 'results'>[]>([])
  const [resultCounts, setResultCounts] = useState<{ total: number; available: number }[]>([])
  const [selectedRunResults, setSelectedRunResults] = useState<CheckResult[]>([])
  const [selectedResult, setSelectedResult] = useState<CheckResult | null>(null)

  useEffect(() => {
    const db = openDatabase()
    initializeSchema(db)
    const loadedRuns = getRuns(db)
    const counts = loadedRuns.map((run) => {
      const results = getRunResults(db, run.id)
      return {
        total: results.length,
        available: results.filter((r) => r.available).length,
      }
    })
    setRuns(loadedRuns)
    setResultCounts(counts)
    db.close()
  }, [])

  useInput((input, key) => {
    if (input === 'q') {
      exit()
      return
    }
    if ((input === 'b' || key.escape) && view !== 'runs') {
      match(view)
        .with('results', () => setView('runs'))
        .with('detail', () => setView('results'))
        .exhaustive()
    }
  })

  const handleRunSelect = (runIdStr: string): void => {
    const runId = Number(runIdStr)
    const db = openDatabase()
    initializeSchema(db)
    const results = getRunResults(db, runId)
    db.close()
    setSelectedRunResults(results)
    setView('results')
  }

  const handleResultSelect = (indexStr: string): void => {
    const result = selectedRunResults[Number(indexStr)]
    if (result) {
      setSelectedResult(result)
      setView('detail')
    }
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Logo />
      {match(view)
        .with('runs', () => (
          <RunList runs={runs} resultCounts={resultCounts} onSelect={handleRunSelect} />
        ))
        .with('results', () => (
          <ResultTable results={selectedRunResults} onSelect={handleResultSelect} />
        ))
        .with('detail', () =>
          selectedResult ? <DetailView result={selectedResult} /> : null
        )
        .exhaustive()}
      <StatusBar view={view} />
    </Box>
  )
}

export default screen({
  name: '$default',
  description: 'Interactive dashboard — browse check results and past runs',
  fullscreen: true,
  render: Dashboard,
})
```

Note: The `name: '$default'` makes this the default command when `monkeywrench` is run without arguments. Check kidd docs to confirm the exact convention — it may be `name: 'default'` or handled via the `cli()` config's `defaultCommand` option. If kidd uses filename-based routing, name the file `$default.tsx` instead.

- [ ] **Step 7: Test the dashboard manually**

Run: `cd packages/cli && pnpm dev`
Expected: Dashboard opens with gradient logo, runs list (empty if no prior checks)

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/commands/dashboard.tsx packages/cli/src/components/
git commit -m "feat: add dashboard TUI with gradient logo and drill-down views"
```

---

## Phase 3: Vercel Skills

### Task 11: Create `check` skill

**Files:**
- Create: `skills/check/SKILL.md`
- Create: `skills/check/setup.sh`

- [ ] **Step 1: Create `skills/check/setup.sh`**

```bash
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
```

- [ ] **Step 2: Create `skills/check/SKILL.md`**

```markdown
---
name: monkeywrench-check
description: Check npm package name availability, squatter detection, and similarity scoring. Use when the user wants to validate whether a package name is available, taken, or squatted.
metadata:
  author: zrosenbauer
  version: "0.0.1"
---

# Check npm Package Names

Validate one or more npm package names for availability, squatter status, and similarity to existing packages.

## Setup

Run the setup script to ensure the CLI is installed:

```bash
! bash ./setup.sh
```

## Usage

Check one or more names:

```bash
! monkeywrench check <name1> <name2> <name3> --format=agent
```

Check names from a JSON file:

```bash
! monkeywrench check --file candidates.json --format=agent
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
```

- [ ] **Step 3: Commit**

```bash
git add skills/check/
git commit -m "feat: add monkeywrench-check Vercel skill"
```

---

### Task 12: Create `think` skill

**Files:**
- Create: `skills/think/SKILL.md`
- Create: `skills/think/setup.sh`

- [ ] **Step 1: Create `skills/think/setup.sh`**

```bash
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
```

- [ ] **Step 2: Create `skills/think/SKILL.md`**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add skills/think/
git commit -m "feat: add monkeywrench-think Vercel skill for creative naming workflow"
```

---

## Phase 4: CI & Polish

### Task 13: Add GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm typecheck

      - run: pnpm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflow for build, typecheck, and test"
```

---

### Task 14: Add snapshot build workflow

**Files:**
- Create: `.github/workflows/snapshot.yml`

- [ ] **Step 1: Create `.github/workflows/snapshot.yml`**

This workflow runs weekly, builds the full embeddings DB, and attaches it to a GitHub release.

```yaml
name: Build Snapshot

on:
  schedule:
    - cron: '0 6 * * 1' # Weekly on Monday at 6am UTC
  workflow_dispatch: # Manual trigger

jobs:
  build-snapshot:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Build snapshot database
        run: |
          node -e "
            import { openDatabase, initializeSchema } from '@monkeywrench/db';
            import { syncPackageNames, embedNewPackages } from '@monkeywrench/data';
            const db = openDatabase('./monkeywrench.db');
            initializeSchema(db);
            await syncPackageNames(db);
            await embedNewPackages(db);
            db.close();
          "

      - name: Get date tag
        id: date
        run: echo "tag=snapshot-$(date +%Y%m%d)" >> "$GITHUB_OUTPUT"

      - name: Create release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ steps.date.outputs.tag }}
          name: "Snapshot ${{ steps.date.outputs.tag }}"
          files: monkeywrench.db
          body: "Weekly pre-built package database snapshot."
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/snapshot.yml
git commit -m "ci: add weekly snapshot build workflow"
```

---

### Task 15: Update AGENTS.md and root package.json for publishing

**Files:**
- Modify: `AGENTS.md`
- Modify: `packages/cli/package.json`

- [ ] **Step 1: Update AGENTS.md with final architecture**

Re-read the current `AGENTS.md` and update it to reflect the completed implementation: actual file paths, actual commands, actual dependencies. Remove any speculative language.

- [ ] **Step 2: Update `packages/cli/package.json` for npm publishing**

Add the following fields for publishing to npm as `monkeywrench`:

```json
{
  "name": "monkeywrench",
  "version": "0.0.1",
  "description": "npm package naming toolkit — generate, check, and score package names",
  "keywords": ["npm", "package", "naming", "cli", "squatter", "availability"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/zrosenbauer/monkeywrench.git",
    "directory": "packages/cli"
  }
}
```

Note: The package name for npm should be `monkeywrench` (not `@monkeywrench/cli`) since this is the user-facing CLI.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md packages/cli/package.json
git commit -m "chore: update AGENTS.md and prepare CLI for npm publishing"
```

---

### Task 16: Run full build and verify

- [ ] **Step 1: Install all dependencies from root**

Run: `pnpm install`
Expected: All workspace packages resolved

- [ ] **Step 2: Run full build**

Run: `pnpm build`
Expected: All 5 packages build successfully

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass across `db`, `data`, and `core` packages

- [ ] **Step 4: Test CLI end-to-end**

Run: `cd packages/cli && pnpm dev -- check react express nonexistent-pkg-12345 --format=table`
Expected: Table output showing react (taken, not squatted), express (taken, not squatted), nonexistent-pkg-12345 (available, low risk)

- [ ] **Step 5: Test dashboard**

Run: `cd packages/cli && pnpm dev`
Expected: Dashboard opens with logo, shows the run from step 4

- [ ] **Step 6: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve issues found during integration testing"
```
