import type Database from 'better-sqlite3'
import { openDatabase, initializeSchema, getSyncMeta } from '@monkeywrench/db'
import { hasLocalDatabase, downloadSnapshot, getLatestSnapshot, syncPackageNames, embedNewPackages } from '@monkeywrench/data'

export async function ensureDatabase(): Promise<Database.Database> {
  if (!hasLocalDatabase()) {
    const snapshot = await getLatestSnapshot()
    if (snapshot) {
      console.log('Downloading package database...')
      await downloadSnapshot(snapshot.downloadUrl)
      console.log('Download complete.')
    }
  }

  const db = openDatabase()
  initializeSchema(db)

  const meta = getSyncMeta(db)

  if (meta.packageCount === 0) {
    console.log('Syncing package names...')
    const { added } = await syncPackageNames(db)
    console.log(`Added ${added} packages.`)

    console.log('Generating embeddings for new packages...')
    const { embedded } = await embedNewPackages(db)
    console.log(`Embedded ${embedded} packages.`)
  } else if (meta.lastSync) {
    const daysSinceSync = (Date.now() - new Date(meta.lastSync).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSync > 7) {
      console.warn('Package database is over 7 days old. Run `monkeywrench sync` to update.')
    }
  }

  return db
}
