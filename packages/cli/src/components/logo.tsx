import React from 'react'
import { Box, Text } from '@kidd-cli/core/ui'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'

export function Logo(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient name="vice">
        <BigText text="monkeywrench" font="tiny" />
      </Gradient>
      <Text color="gray">npm package naming toolkit</Text>
    </Box>
  )
}
