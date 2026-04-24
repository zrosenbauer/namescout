import { downloadSnapshot, hasLocalDatabase } from '@namescout/data'
import { getSyncMeta, initializeSchema, openDatabase } from '@namescout/db'
import type Database from 'better-sqlite3'

export async function ensureDatabase(): Promise<Database.Database> {
  if (!hasLocalDatabase()) {
    console.log('Downloading package database...')
    await downloadSnapshot()
    console.log('Download complete.')
  }

  const db = openDatabase()
  initializeSchema(db)

  const meta = getSyncMeta(db)

  if (meta.lastSync) {
    const daysSinceSync = (Date.now() - new Date(meta.lastSync).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSync > 7) {
      console.warn('Package database is over 7 days old. Run `namescout sync` to update.')
    }
  }

  return db
}
