import type Database from 'better-sqlite3'
import type { CheckResult, OutputFormat } from '@monkeywrench/types'
import { createRun, insertResult } from '@monkeywrench/db'
import { checkSquatterBatch } from './squatter.js'
import { findStringSimilar, findSemanticSimilar } from './similarity.js'
import { computeRisk } from './risk.js'
import { formatTable, formatAgent, formatJson } from './format.js'

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
      const squat = squatterResults.get(name)!
      const [stringMatches, semanticMatches] = await Promise.all([
        findStringSimilar(db, name),
        findSemanticSimilar(db, name),
      ])
      const riskLevel = computeRisk({
        available: !squat.exists,
        squatted: squat.squatted,
        stringMatches,
        semanticMatches,
      })
      return {
        name,
        available: !squat.exists,
        squatted: squat.squatted,
        riskLevel,
        stringMatches,
        semanticMatches,
      } satisfies CheckResult
    })
  )
  results.push(...checkResults)

  const runId = createRun(db, source)
  for (const result of results) {
    insertResult(db, runId, result)
  }

  let formatted: string
  switch (format) {
    case 'table':
      formatted = formatTable(results)
      break
    case 'agent':
      formatted = formatAgent(results)
      break
    case 'json':
      formatted = formatJson(results)
      break
  }

  return { runId, results, formatted }
}
