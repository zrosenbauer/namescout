import type { CheckResult, RiskLevel } from '@namescout/types'

function formatSquatted(squatted: boolean | null): string {
  if (squatted === null) {
    return '-'
  }
  if (squatted) {
    return '⚠ likely'
  }
  return '✓ no'
}

function formatRisk(level: RiskLevel): string {
  if (level === 'high') {
    return '🔴 high'
  }
  if (level === 'medium') {
    return '🟡 medium'
  }
  return '🟢 low'
}

function formatStatus(available: boolean, squatted: boolean | null): string {
  if (available) {
    return 'AVAILABLE'
  }
  if (squatted) {
    return 'SQUATTED'
  }
  return 'TAKEN'
}

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
    const squat = formatSquatted(r.squatted)
    const risk = formatRisk(r.riskLevel)
    const topMatch = r.stringMatches[0]?.name ?? '-'
    const link = r.available ? '-' : npmUrl(r.name)
    return [r.name, avail, squat, risk, topMatch, link]
  })

  const widths = columns.map((col, i) =>
    Math.max(col.length, ...rows.map((row) => (row[i] ?? '').length))
  )

  const header = columns.map((col, i) => pad(col, widths[i] ?? 0)).join('  ')
  const sep = widths.map((w) => '─'.repeat(w)).join('──')
  const body = rows.map((row) => row.map((cell, i) => pad(cell, widths[i] ?? 0)).join('  '))

  return ['', header, sep, ...body, ''].join('\n')
}

export function formatAgent(results: readonly CheckResult[]): string {
  const lines = results.map((r) => {
    const status = formatStatus(r.available, r.squatted)
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
