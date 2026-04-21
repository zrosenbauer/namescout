import React from 'react'
import { Box, Text } from '@kidd-cli/core/ui'

interface StatusBarProps {
  readonly view: string
}

const HINTS: Record<string, string> = {
  runs: 'arrows: navigate | enter: select | q: quit',
  results: 'arrows: navigate | enter: detail | b: back | q: quit',
  detail: 'b: back | q: quit',
}

export function StatusBar({ view }: StatusBarProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color="gray">{HINTS[view] ?? 'q: quit'}</Text>
    </Box>
  )
}
