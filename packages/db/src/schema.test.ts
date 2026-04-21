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
