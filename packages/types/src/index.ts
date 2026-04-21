// ── Risk Levels ──────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'

// ── Similarity Match ─────────────────────────────────────────────────────────

export interface SimilarityMatch {
  readonly name: string
  readonly score: number
}

// ── Check Result (per candidate name) ────────────────────────────────────────

export interface CheckResult {
  readonly name: string
  readonly available: boolean
  readonly squatted: boolean | null
  readonly riskLevel: RiskLevel
  readonly stringMatches: readonly SimilarityMatch[]
  readonly semanticMatches: readonly SimilarityMatch[]
}

// ── Run (a batch of checks) ──────────────────────────────────────────────────

export interface Run {
  readonly id: number
  readonly timestamp: string
  readonly source: 'cli' | 'file'
  readonly results: readonly CheckResult[]
}

// ── Output Formats ───────────────────────────────────────────────────────────

export type OutputFormat = 'table' | 'agent' | 'json'

// ── Sync Metadata ────────────────────────────────────────────────────────────

export interface SyncMeta {
  readonly lastSync: string | null
  readonly packageCount: number
  readonly snapshotVersion: string | null
}
