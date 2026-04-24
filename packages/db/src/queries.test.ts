import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

import {
  createRun,
  getMeta,
  getPackageCount,
  getPackageId,
  getRunResults,
  getRuns,
  getSyncMeta,
  insertPackages,
  insertResult,
  setMeta,
} from './queries.js'
import { initializeSchema } from './schema.js'

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
      available: true,
      name: 'fetchcraft',
      riskLevel: 'low',
      semanticMatches: [{ name: 'http-get', score: 0.7 }],
      squatted: null,
      stringMatches: [{ name: 'fetch', score: 0.8 }],
    })

    const runs = getRuns(db)
    expect(runs).toHaveLength(1)
    expect(runs[0]?.source).toBe('cli')

    const results = getRunResults(db, runId)
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('fetchcraft')
    expect(results[0]?.available).toBe(true)
    expect(results[0]?.squatted).toBeNull()
    expect(results[0]?.stringMatches).toStrictEqual([{ name: 'fetch', score: 0.8 }])
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
