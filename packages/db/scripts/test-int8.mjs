import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

const db = new Database(':memory:')
sqliteVec.load(db)

db.exec('CREATE VIRTUAL TABLE test_int8 USING vec0(id INTEGER PRIMARY KEY, embedding int8[384])')
console.log('int8 vec0 table: OK')

// Quantize float32 to int8 (scale normalized vectors to -128..127)
function quantizeToInt8(float32) {
  const int8 = new Int8Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    int8[i] = Math.max(-128, Math.min(127, Math.round(float32[i] * 127)))
  }
  return int8
}

// Insert quantized vector
const vec = new Float32Array(384)
for (let i = 0; i < 384; i++) {vec[i] = Math.random() * 2 - 1}
const int8Vec = quantizeToInt8(vec)
console.log('int8 buffer length:', int8Vec.buffer.byteLength, 'expected:', 384)
console.log('float32 buffer length:', vec.buffer.byteLength, 'expected:', 1536)

// Try raw Buffer
const buf = Buffer.from(int8Vec.buffer)
console.log('Buffer length:', buf.length)
db.prepare('INSERT INTO test_int8 (id, embedding) VALUES (1, vec_int8(?))').run(buf)
console.log('Insert int8 vector: OK')

// Insert more vectors for KNN
for (let j = 2; j <= 10; j++) {
  const v = new Float32Array(384)
  for (let i = 0; i < 384; i++) {v[i] = Math.random() * 2 - 1}
  db.prepare(`INSERT INTO test_int8 (id, embedding) VALUES (${j}, vec_int8(?))`).run(
    Buffer.from(quantizeToInt8(v).buffer)
  )
}
console.log('Inserted 10 vectors: OK')

// KNN search with int8 query
const queryVec = quantizeToInt8(vec)
const results = db
  .prepare('SELECT id, distance FROM test_int8 WHERE embedding MATCH vec_int8(?) AND k = 3')
  .all(Buffer.from(queryVec.buffer))
console.log('KNN search results:', results)
console.log('First result is self-match:', results[0]?.id === 1 && results[0]?.distance === 0)

db.close()
console.log('All tests passed.')
