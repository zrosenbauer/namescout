import { Box, Text } from '@kidd-cli/core/ui'
import React from 'react'

interface StatusBarProps {
  readonly view: string
}

const HINTS: Record<string, string> = {
  detail: 'b: back | q: quit',
  results: 'arrows: navigate | enter: detail | b: back | q: quit',
  runs: 'arrows: navigate | enter: select | q: quit',
}

export function StatusBar({ view }: StatusBarProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color="gray">{HINTS[view] ?? 'q: quit'}</Text>
    </Box>
  )
}
