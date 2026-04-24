import os from 'node:os'
import path from 'node:path'

/**
 * Migrate package_embeddings from float32[384] to int8[384].
 *
 * Reads all embeddings, quantizes to int8, recreates the vec0 table.
 * Run from packages/db: node scripts/migrate-int8.mjs [db-path]
 *
 * sqlite-vec vec0 INSERT reference:
 *   INSERT INTO table(rowid, embedding) VALUES (?, ?)
 *   - rowid must be BigInt
 *   - int8 vectors need vec_int8() wrapper
 *   See: https://alexgarcia.xyz/sqlite-vec/api-reference.html
 */
import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

const DB_PATH = process.argv[2] || path.join(os.homedir(), '.namescout', 'namescout.db')

console.log(`Migrating ${DB_PATH} from float32 to int8...`)

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
sqliteVec.load(db)

// Count embeddings
const { count } = db.prepare('SELECT COUNT(*) as count FROM package_embeddings_rowids').get()
console.log(`Found ${count} embeddings to migrate`)

// Create temp table for int8 embeddings
db.exec(
  'CREATE VIRTUAL TABLE IF NOT EXISTS package_embeddings_int8 USING vec0(id INTEGER PRIMARY KEY, embedding int8[384])'
)

const BATCH = 10_000
let migrated = 0

const readStmt = db.prepare(`
  SELECT e.id, e.embedding
  FROM package_embeddings e
  ORDER BY e.id
  LIMIT ? OFFSET ?
`)

const insertStmt = db.prepare(
  'INSERT INTO package_embeddings_int8(rowid, embedding) VALUES (?, vec_int8(?))'
)

function quantizeToInt8(float32Buf) {
  const float32 = new Float32Array(
    float32Buf.buffer,
    float32Buf.byteOffset,
    float32Buf.byteLength / 4
  )
  const int8 = new Int8Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    int8[i] = Math.max(-128, Math.min(127, Math.round(float32[i] * 127)))
  }
  return Buffer.from(int8.buffer)
}

for (let offset = 0; offset < count; offset += BATCH) {
  const rows = readStmt.all(BATCH, offset)

  const insertMany = db.transaction((batch) => {
    for (const row of batch) {
      const int8Buf = quantizeToInt8(row.embedding)
      insertStmt.run(BigInt(row.id), int8Buf)
    }
  })

  insertMany(rows)
  migrated += rows.length
  process.stderr.write(`\r  Migrated: ${migrated}/${count}`)
}

console.log('')

// Drop old table, rename new one
console.log('Dropping old float32 table...')
db.exec('DROP TABLE package_embeddings')

console.log('Renaming int8 table...')
db.exec('ALTER TABLE package_embeddings_int8 RENAME TO package_embeddings')

// Verify
const newCount = db.prepare('SELECT COUNT(*) as count FROM package_embeddings_rowids').get()
console.log(`Verification: ${newCount.count} embeddings in new int8 table`)

// Vacuum to reclaim space
console.log('Vacuuming database...')
db.exec('VACUUM')

db.close()
console.log('Migration complete.')
