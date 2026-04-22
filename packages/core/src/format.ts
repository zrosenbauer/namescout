import type { CheckResult } from '@monkeywrench/types'

function npmUrl(name: string): string {
  return `https://www.npmjs.com/package/${name}`
}

function pad(str: string, width: number): string {
  return str + ' '.repeat(Math.max(0, width - str.length))
}

export function formatTable(results: readonly CheckResult[]): string {
  const columns = ['Name', 'Available', 'Squatted', 'Risk', 'Top Match', 'npm Link'] as const

  const rows = results.map((r) => {
    const avail = r.available ? '✓ yes' : '✗ no'
    const squat = r.squatted === null ? '-' : r.squatted ? '⚠ likely' : '✓ no'
    const risk = r.riskLevel === 'high' ? '🔴 high' : r.riskLevel === 'medium' ? '🟡 medium' : '🟢 low'
    const topMatch = r.stringMatches[0]?.name ?? '-'
    const link = r.available ? '-' : npmUrl(r.name)
    return [r.name, avail, squat, risk, topMatch, link]
  })

  const widths = columns.map((col, i) =>
    Math.max(col.length, ...rows.map((row) => row[i]!.length))
  )

  const header = columns.map((col, i) => pad(col, widths[i]!)).join('  ')
  const sep = widths.map((w) => '─'.repeat(w)).join('──')
  const body = rows.map((row) =>
    row.map((cell, i) => pad(cell, widths[i]!)).join('  ')
  )

  return ['', header, sep, ...body, ''].join('\n')
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
