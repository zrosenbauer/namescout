import { embedText } from '@namescout/data'
import { findSimilarByVector } from '@namescout/db'
import type { SimilarityMatch } from '@namescout/types'
import type Database from 'better-sqlite3'

let cmpstrModule: typeof import('cmpstr') | null = null // oxlint-disable-line functional/no-let -- lazy-loaded module cache

async function getCmpStr() {
  if (!cmpstrModule) {
    cmpstrModule = await import('cmpstr')
  }
  return cmpstrModule
}

export async function findStringSimilar(
  db: Database.Database,
  name: string,
  limit: number = 10
): Promise<SimilarityMatch[]> {
  const prefix = name.slice(0, 3)
  const candidates = db
    .prepare(`
      SELECT name FROM packages
      WHERE name LIKE ? OR name LIKE ?
      LIMIT 500
    `)
    .all(`${name}%`, `%${prefix}%`)
    .map((row) => (row as { name: string }).name)

  if (candidates.length === 0) {
    return []
  }

  const { CmpStr } = await getCmpStr()
  const cmp = new CmpStr({ metric: 'jaroWinkler' })
  const ranked = cmp.batchSorted(name, candidates, 'desc') as { target: string; match: number }[]

  return ranked.slice(0, limit).map((m) => ({
    name: m.target,
    score: m.match,
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
