import { createRun, insertResult } from '@namescout/db'
import type { CheckResult, OutputFormat } from '@namescout/types'
import type Database from 'better-sqlite3'

import { formatAgent, formatJson, formatTable } from './format.js'

function formatOutput(format: OutputFormat, results: readonly CheckResult[]): string {
  switch (format) {
    case 'table': {
      return formatTable(results)
    }
    case 'agent': {
      return formatAgent(results)
    }
    case 'json': {
      return formatJson(results)
    }
  }
}
import { computeRisk } from './risk.js'
import { findSemanticSimilar, findStringSimilar } from './similarity.js'
import { checkSquatterBatch } from './squatter.js'

export interface CheckOptions {
  readonly names: readonly string[]
  readonly source: 'cli' | 'file'
  readonly format: OutputFormat
}

export interface CheckOutput {
  readonly runId: number
  readonly results: readonly CheckResult[]
  readonly formatted: string
}

export async function runCheck(db: Database.Database, options: CheckOptions): Promise<CheckOutput> {
  const { names, source, format } = options

  const squatterResults = await checkSquatterBatch(names)

  const results: CheckResult[] = []

  const checkResults = await Promise.all(
    names.map(async (name) => {
      const squat = squatterResults.get(name) ?? { exists: false, squatted: null }
      const [stringMatches, semanticMatches] = await Promise.all([
        findStringSimilar(db, name),
        findSemanticSimilar(db, name),
      ])
      const riskLevel = computeRisk({
        available: !squat.exists,
        semanticMatches,
        squatted: squat.squatted,
        stringMatches,
      })
      return {
        available: !squat.exists,
        name,
        riskLevel,
        semanticMatches,
        squatted: squat.squatted,
        stringMatches,
      } satisfies CheckResult
    })
  )
  results.push(...checkResults)

  const runId = createRun(db, source)
  for (const result of results) {
    insertResult(db, runId, result)
  }

  const formatted = formatOutput(format, results)

  return { formatted, results, runId }
}
