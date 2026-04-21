import type Database from 'better-sqlite3'
import type { SimilarityMatch } from '@monkeywrench/types'
import { findSimilarByVector } from '@monkeywrench/db'
import { embedText } from '@monkeywrench/data'

export async function findStringSimilar(
  db: Database.Database,
  name: string,
  limit: number = 10
): Promise<SimilarityMatch[]> {
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
