import fs from 'node:fs'

import { command } from '@kidd-cli/core'
import { runCheck } from '@namescout/core'
import type { OutputFormat } from '@namescout/types'
import { z } from 'zod'

import { ensureDatabase } from '../lib/ensure-db.js'

const options = z.object({
  file: z.string().optional().describe('JSON file with candidate names'),
  format: z.enum(['table', 'agent', 'json']).default('table').describe('Output format'),
})

export default command({
  description: 'Check package name availability, squatter status, and similarity',
  async handler(ctx) {
    const raw = (ctx.args as Record<string, unknown>).names as string | string[]
    const names: string[] = Array.isArray(raw) ? [...raw] : [raw]

    if (ctx.args.file) {
      const content = fs.readFileSync(ctx.args.file, 'utf8')
      const parsed = JSON.parse(content)
      const fileNames = Array.isArray(parsed) ? parsed : parsed.names
      names.push(...(fileNames as string[]))
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
  name: 'check <names..>',
  options,
})
