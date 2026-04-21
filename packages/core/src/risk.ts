import type { RiskLevel, SimilarityMatch } from '@monkeywrench/types'

interface RiskInput {
  readonly available: boolean
  readonly squatted: boolean | null
  readonly stringMatches: readonly SimilarityMatch[]
  readonly semanticMatches: readonly SimilarityMatch[]
}

export function computeRisk(input: RiskInput): RiskLevel {
  const { available, squatted, stringMatches, semanticMatches } = input

  if (!available && !squatted) {
    return 'high'
  }

  const topStringScore = stringMatches[0]?.score ?? 0
  if (topStringScore > 0.92) {
    return 'high'
  }

  const topSemanticScore = semanticMatches[0]?.score ?? 0
  if (topSemanticScore > 0.9) {
    return 'high'
  }

  if (!available && squatted) {
    return 'medium'
  }

  if (topStringScore > 0.8 || topSemanticScore > 0.8) {
    return 'medium'
  }

  return 'low'
}
