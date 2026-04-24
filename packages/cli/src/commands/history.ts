import { command } from '@kidd-cli/core'
import { getRunResults, getRuns, initializeSchema, openDatabase } from '@namescout/db'

export default command({
  description: 'List past check runs',
  handler(ctx) {
    const db = openDatabase()
    initializeSchema(db)

    try {
      const runs = getRuns(db)

      if (runs.length === 0) {
        ctx.log.info('No runs yet. Use `namescout check` to check some names.')
        return
      }

      const rows = runs.map((run) => {
        const results = getRunResults(db, run.id)
        const available = results.filter((r) => r.available).length
        return {
          Available: `${available}/${results.length}`,
          Date: run.timestamp,
          ID: run.id,
          Names: results.length,
          Source: run.source,
        }
      })

      ctx.log.raw(ctx.format.table(rows))
    } finally {
      db.close()
    }
  },
})
