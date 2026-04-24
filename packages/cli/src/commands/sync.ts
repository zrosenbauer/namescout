import { command } from '@kidd-cli/core'
import {
  downloadSnapshot,
  embedNewPackages,
  getLatestSnapshot,
  hasLocalDatabase,
  syncPackageNames,
} from '@namescout/data'
import { getSyncMeta, initializeSchema, openDatabase } from '@namescout/db'

export default command({
  description: 'Download or update the package name database',
  async handler(ctx) {
    if (!hasLocalDatabase()) {
      const snapshot = await getLatestSnapshot()
      if (snapshot) {
        ctx.log.info(`Downloading snapshot ${snapshot.version}...`)
        await downloadSnapshot(snapshot.downloadUrl)
        ctx.log.info('Snapshot downloaded.')
      }
    }

    const db = openDatabase()
    initializeSchema(db)

    try {
      ctx.log.info('Syncing package names...')
      const { added } = await syncPackageNames(db, (progress) => {
        if (progress.phase === 'inserting-names' && progress.current > 0) {
          process.stderr.write(`\r  Inserting: ${progress.current}/${progress.total}`)
        }
      })
      console.error('')
      ctx.log.info(`Sync complete. ${added} new packages added.`)

      ctx.log.info('Embedding new packages...')
      const { embedded } = await embedNewPackages(db, (progress) => {
        if (progress.phase === 'embedding' && progress.current > 0) {
          process.stderr.write(`\r  Embedding: ${progress.current}/${progress.total}`)
        }
      })
      console.error('')
      ctx.log.info(`Done. ${embedded} new embeddings generated.`)

      const meta = getSyncMeta(db)
      ctx.log.info(`Total packages: ${meta.packageCount}`)
    } finally {
      db.close()
    }
  },
})
