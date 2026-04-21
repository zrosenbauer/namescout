import React from 'react'
import { Box, Select, Text } from '@kidd-cli/core/ui'
import type { CheckResult } from '@monkeywrench/types'

interface ResultTableProps {
  readonly results: readonly CheckResult[]
  readonly onSelect: (index: string) => void
}

export function ResultTable({ results, onSelect }: ResultTableProps): React.ReactElement {
  const options = results.map((r, i) => {
    const avail = r.available ? '✓' : '✗'
    const squat = r.squatted === null ? '' : r.squatted ? ' (squatted)' : ''
    return {
      label: `${avail} ${r.name} — ${r.riskLevel} risk${squat}`,
      value: String(i),
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Results</Text>
      <Box gap={2} marginBottom={1}>
        <Text color="green">✓ available</Text>
        <Text color="red">✗ taken</Text>
      </Box>
      <Select options={options} onSubmit={onSelect} />
    </Box>
  )
}
