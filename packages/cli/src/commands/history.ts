import { command } from '@kidd-cli/core'
import { openDatabase, initializeSchema, getRuns, getRunResults } from '@monkeywrench/db'

export default command({
  description: 'List past check runs',
  async handler(ctx) {
    const db = openDatabase()
    initializeSchema(db)

    try {
      const runs = getRuns(db)

      if (runs.length === 0) {
        ctx.log.info('No runs yet. Use `monkeywrench check` to check some names.')
        return
      }

      const rows = runs.map((run) => {
        const results = getRunResults(db, run.id)
        const available = results.filter((r) => r.available).length
        return {
          ID: run.id,
          Date: run.timestamp,
          Source: run.source,
          Names: results.length,
          Available: `${available}/${results.length}`,
        }
      })

      ctx.log.raw(ctx.format.table(rows))
    } finally {
      db.close()
    }
  },
})
