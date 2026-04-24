import type { CheckResult } from '@namescout/types'

import { formatAgent, formatJson, formatTable } from './format.js'

const MOCK_RESULTS: CheckResult[] = [
  {
    available: true,
    name: 'fetchcraft',
    riskLevel: 'low',
    semanticMatches: [{ name: 'http-get', score: 0.7 }],
    squatted: null,
    stringMatches: [{ name: 'fetch', score: 0.8 }],
  },
  {
    available: false,
    name: 'reqwest',
    riskLevel: 'medium',
    semanticMatches: [],
    squatted: true,
    stringMatches: [{ name: 'request', score: 0.9 }],
  },
]

describe('formatTable', () => {
  it('produces a markdown table', () => {
    const table = formatTable(MOCK_RESULTS)
    expect(table).toContain('fetchcraft')
    expect(table).toContain('reqwest')
    expect(table).toContain('Name')
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
