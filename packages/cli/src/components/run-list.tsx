import React from 'react'
import { Box, Select, Text } from '@kidd-cli/core/ui'
import type { Run } from '@monkeywrench/types'

interface RunListProps {
  readonly runs: readonly Omit<Run, 'results'>[]
  readonly resultCounts: readonly { total: number; available: number }[]
  readonly onSelect: (runId: string) => void
}

export function RunList({ runs, resultCounts, onSelect }: RunListProps): React.ReactElement {
  if (runs.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray">No runs yet. Use `monkeywrench check` to get started.</Text>
      </Box>
    )
  }

  const options = runs.map((run, i) => {
    const counts = resultCounts[i]!
    return {
      label: `${run.timestamp} [${run.source}] — ${counts.available}/${counts.total} available`,
      value: String(run.id),
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Past Runs</Text>
      <Select options={options} onSubmit={onSelect} />
    </Box>
  )
}
