import { Box, Text } from '@kidd-cli/core/ui'
import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'
import React from 'react'

export function Logo(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient name="vice">
        <BigText text="namescout" font="tiny" />
      </Gradient>
      <Text color="gray">npm package naming toolkit</Text>
    </Box>
  )
}
