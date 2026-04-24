import { Box, Text } from '@kidd-cli/core/ui'
import type { CheckResult, RiskLevel } from '@namescout/types'
import React from 'react'

function formatSquatted(squatted: boolean | null): string {
  if (squatted === null) {
    return '-'
  }
  return squatted ? 'likely' : 'no'
}

function riskColor(level: RiskLevel): string {
  if (level === 'low') {
    return 'green'
  }
  if (level === 'medium') {
    return 'yellow'
  }
  return 'red'
}

interface DetailViewProps {
  readonly result: CheckResult
}

export function DetailView({ result }: DetailViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>{result.name}</Text>

      <Box gap={2}>
        <Text>
          Available:{' '}
          <Text color={result.available ? 'green' : 'red'}>{result.available ? 'yes' : 'no'}</Text>
        </Text>
        <Text>
          Squatted: <Text>{formatSquatted(result.squatted)}</Text>
        </Text>
        <Text>
          Risk: <Text color={riskColor(result.riskLevel)}>{result.riskLevel}</Text>
        </Text>
      </Box>

      {result.stringMatches.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Similar Names (string)</Text>
          {result.stringMatches.slice(0, 5).map((m) => (
            <Text key={m.name}>
              {' '}
              {m.name} ({(m.score * 100).toFixed(0)}%)
            </Text>
          ))}
        </Box>
      )}

      {result.semanticMatches.length > 0 && (
        <Box flexDirection="column">
          <Text bold>Similar Names (semantic)</Text>
          {result.semanticMatches.slice(0, 5).map((m) => (
            <Text key={m.name}>
              {' '}
              {m.name} ({(m.score * 100).toFixed(0)}%)
            </Text>
          ))}
        </Box>
      )}

      <Text color="gray">Press b to go back</Text>
    </Box>
  )
}
