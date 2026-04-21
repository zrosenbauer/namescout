import { describe, it, expect } from 'vitest'
import { formatTable, formatAgent, formatJson } from './format.js'
import type { CheckResult } from '@monkeywrench/types'

const MOCK_RESULTS: CheckResult[] = [
  {
    name: 'fetchcraft',
    available: true,
    squatted: null,
    riskLevel: 'low',
    stringMatches: [{ name: 'fetch', score: 0.8 }],
    semanticMatches: [{ name: 'http-get', score: 0.7 }],
  },
  {
    name: 'reqwest',
    available: false,
    squatted: true,
    riskLevel: 'medium',
    stringMatches: [{ name: 'request', score: 0.9 }],
    semanticMatches: [],
  },
]

describe('formatTable', () => {
  it('produces a markdown table', () => {
    const table = formatTable(MOCK_RESULTS)
    expect(table).toContain('| fetchcraft |')
    expect(table).toContain('| reqwest |')
    expect(table).toContain('| Name |')
  })
})

describe('formatAgent', () => {
  it('produces compressed markdown', () => {
    const output = formatAgent(MOCK_RESULTS)
    expect(output).toContain('**fetchcraft** [AVAILABLE] risk:LOW')
    expect(output).toContain('**reqwest** [SQUATTED] risk:MEDIUM')
  })
})

describe('formatJson', () => {
  it('produces valid JSON', () => {
    const output = formatJson(MOCK_RESULTS)
    const parsed = JSON.parse(output)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].name).toBe('fetchcraft')
  })
})
