import { createRequire } from 'node:module'

import {
  getPackageCount,
  getPackageId,
  getPackageNamesNotEmbedded,
  insertEmbeddings,
  insertPackages,
  setMeta,
} from '@namescout/db'
import type Database from 'better-sqlite3'

import { embedBatch } from './embed.js'

function chunkArray<T>(arr: readonly T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, (i + 1) * size) as T[]
  )
}

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
  onProgress?.({ current: 0, phase: 'loading-names', total: 0 })

  const require = createRequire(import.meta.url)
  const allNames: string[] = require('all-the-package-names')
  const beforeCount = getPackageCount(db)

  onProgress?.({ current: 0, phase: 'inserting-names', total: allNames.length })

  const INSERT_BATCH = 10_000
  const insertBatches = chunkArray(allNames, INSERT_BATCH)
  for (const [batchIdx, batch] of insertBatches.entries()) {
    insertPackages(db, batch)
    onProgress?.({
      current: Math.min((batchIdx + 1) * INSERT_BATCH, allNames.length),
      phase: 'inserting-names',
      total: allNames.length,
    })
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
    onProgress?.({ current: 0, phase: 'done', total: 0 })
    return { embedded: 0 }
  }

  const EMBED_BATCH = 100
  const embedBatches = chunkArray(unembedded, EMBED_BATCH)
  let embedded = 0 // oxlint-disable-line functional/no-let -- accumulator across batches

  for (const [batchIdx, batch] of embedBatches.entries()) {
    onProgress?.({ current: batchIdx * EMBED_BATCH, phase: 'embedding', total: unembedded.length })

    const vectors = await embedBatch(batch)

    const entries = batch.map((name, idx) => {
      const id = getPackageId(db, name)
      if (id === null) {
        throw new Error(`Package not found: ${name}`)
      }
      const embedding = vectors[idx]
      if (!embedding) {
        throw new Error(`Missing embedding for index ${idx}`)
      }
      return { embedding, id }
    })

    insertEmbeddings(db, entries)
    embedded += batch.length
  }

  onProgress?.({ current: unembedded.length, phase: 'done', total: unembedded.length })
  return { embedded }
}
