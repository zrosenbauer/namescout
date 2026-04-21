import type { CheckResult } from '@monkeywrench/types'

export function formatTable(results: readonly CheckResult[]): string {
  const header = '| Name | Available | Squatted | Risk | Top Match |'
  const sep = '|------|-----------|----------|------|-----------|'
  const rows = results.map((r) => {
    const avail = r.available ? 'yes' : 'no'
    const squat = r.squatted === null ? '-' : r.squatted ? 'likely' : 'no'
    const topMatch = r.stringMatches[0]?.name ?? '-'
    return `| ${r.name} | ${avail} | ${squat} | ${r.riskLevel} | ${topMatch} |`
  })

  return [header, sep, ...rows].join('\n')
}

export function formatAgent(results: readonly CheckResult[]): string {
  const lines = results.map((r) => {
    const status = r.available ? 'AVAILABLE' : r.squatted ? 'SQUATTED' : 'TAKEN'
    const risk = r.riskLevel.toUpperCase()
    const similar = r.stringMatches
      .slice(0, 3)
      .map((m) => m.name)
      .join(', ')
    return `- **${r.name}** [${status}] risk:${risk}${similar ? ` similar:[${similar}]` : ''}`
  })

  return lines.join('\n')
}

export function formatJson(results: readonly CheckResult[]): string {
  return JSON.stringify(results, null, 2)
}
