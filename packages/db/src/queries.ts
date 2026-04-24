import type { CheckResult, Run, SimilarityMatch, SyncMeta } from '@namescout/types'
import type Database from 'better-sqlite3'

function squattedToInt(squatted: boolean | null): number | null {
  if (squatted === null) {
    return null
  }
  return squatted ? 1 : 0
}

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
    .map((row) => (row as { name: string }).name)
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
    .map((row) => (row as { name: string }).name)
}

export function getPackageId(db: Database.Database, name: string): number | null {
  const row = db.prepare('SELECT id FROM packages WHERE name = ?').get(name) as
    | { id: number | bigint }
    | undefined
  return row ? Number(row.id) : null
}

// ── Embeddings ───────────────────────────────────────────────────────────────

function quantizeToInt8(float32: Float32Array): Buffer {
  const int8 = Int8Array.from(float32, (v) => Math.max(-128, Math.min(127, Math.round(v * 127))))
  return Buffer.from(int8.buffer)
}

export function insertEmbedding(db: Database.Database, id: number, embedding: Float32Array): void {
  db.prepare(
    `INSERT OR REPLACE INTO package_embeddings (id, embedding) VALUES (${id}, vec_int8(?))`
  ).run(quantizeToInt8(embedding))
}

export function insertEmbeddings(
  db: Database.Database,
  entries: readonly { id: number; embedding: Float32Array }[]
): void {
  const insertMany = db.transaction((rows: readonly { id: number; embedding: Float32Array }[]) => {
    for (const { id, embedding } of rows) {
      db.prepare(
        `INSERT OR REPLACE INTO package_embeddings (id, embedding) VALUES (${id}, vec_int8(?))`
      ).run(quantizeToInt8(embedding))
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
      WHERE v.embedding MATCH vec_int8(?) AND k = ?
      ORDER BY v.distance
    `)
    .all(quantizeToInt8(embedding), limit) as { name: string; distance: number }[]

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
    squattedToInt(result.squatted),
    result.riskLevel,
    JSON.stringify(result.stringMatches),
    JSON.stringify(result.semanticMatches)
  )
}

export function getRuns(db: Database.Database, limit: number = 50): Omit<Run, 'results'>[] {
  return db
    .prepare('SELECT id, timestamp, source FROM runs ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as Omit<Run, 'results'>[]
}

export function getRunResults(db: Database.Database, runId: number): CheckResult[] {
  interface ResultRow {
    name: string
    available: number
    squatted: number | null
    risk_level: string
    string_matches: string
    semantic_matches: string
  }

  const rows = db
    .prepare('SELECT * FROM results WHERE run_id = ? ORDER BY id')
    .all(runId) as ResultRow[]

  return rows.map((row) => ({
    available: Boolean(row.available),
    name: row.name,
    riskLevel: row.risk_level as CheckResult['riskLevel'],
    semanticMatches: JSON.parse(row.semantic_matches) as CheckResult['semanticMatches'],
    squatted: row.squatted === null ? null : Boolean(row.squatted),
    stringMatches: JSON.parse(row.string_matches) as CheckResult['stringMatches'],
  }))
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export function getMeta(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined
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
