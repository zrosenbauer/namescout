import { computeRisk } from './risk.js'

describe(computeRisk, () => {
  it('returns high when taken and not squatted', () => {
    expect(
      computeRisk({
        available: false,
        semanticMatches: [],
        squatted: false,
        stringMatches: [],
      })
    ).toBe('high')
  })

  it('returns high when very close string match exists', () => {
    expect(
      computeRisk({
        available: true,
        semanticMatches: [],
        squatted: null,
        stringMatches: [{ name: 'react', score: 0.95 }],
      })
    ).toBe('high')
  })

  it('returns medium when taken but squatted', () => {
    expect(
      computeRisk({
        available: false,
        semanticMatches: [],
        squatted: true,
        stringMatches: [{ name: 'foo', score: 0.5 }],
      })
    ).toBe('medium')
  })

  it('returns medium when moderately similar', () => {
    expect(
      computeRisk({
        available: true,
        semanticMatches: [],
        squatted: null,
        stringMatches: [{ name: 'fetchify', score: 0.85 }],
      })
    ).toBe('medium')
  })

  it('returns low when available and no close matches', () => {
    expect(
      computeRisk({
        available: true,
        semanticMatches: [{ name: 'other', score: 0.4 }],
        squatted: null,
        stringMatches: [{ name: 'unrelated', score: 0.3 }],
      })
    ).toBe('low')
  })

  it('returns low when no matches at all', () => {
    expect(
      computeRisk({
        available: true,
        semanticMatches: [],
        squatted: null,
        stringMatches: [],
      })
    ).toBe('low')
  })
})
