import { createRequire } from 'node:module'
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

  const require = createRequire(import.meta.url)
  const allNames: string[] = require('all-the-package-names')
  const beforeCount = getPackageCount(db)

  onProgress?.({ phase: 'inserting-names', total: allNames.length, current: 0 })

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
