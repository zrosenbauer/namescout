import { command } from '@kidd-cli/core'
import { z } from 'zod'
import { runCheck } from '@monkeywrench/core'
import type { OutputFormat } from '@monkeywrench/types'
import { ensureDatabase } from '../lib/ensure-db.js'
import fs from 'node:fs'

const positionals = z.object({
  names: z.array(z.string()).describe('Package names to check'),
})

const options = z.object({
  file: z.string().optional().describe('JSON file with candidate names'),
  format: z.enum(['table', 'agent', 'json']).default('table').describe('Output format'),
})

export default command({
  description: 'Check package name availability, squatter status, and similarity',
  positionals,
  options,
  async handler(ctx) {
    let names: string[] = [...ctx.args.names]

    if (ctx.args.file) {
      const content = fs.readFileSync(ctx.args.file, 'utf-8')
      const parsed = JSON.parse(content)
      const fileNames = Array.isArray(parsed) ? parsed : parsed.names
      names.push(...fileNames)
    }

    if (names.length === 0) {
      ctx.log.error('No names provided. Pass names as arguments or use --file.')
      process.exit(1)
    }

    const db = await ensureDatabase()

    try {
      const { formatted } = await runCheck(db, {
        names,
        source: ctx.args.file ? 'file' : 'cli',
        format: ctx.args.format as OutputFormat,
      })

      ctx.log.raw(formatted)
    } finally {
      db.close()
    }
  },
})
