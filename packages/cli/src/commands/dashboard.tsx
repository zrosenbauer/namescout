import { Box, screen, useApp, useInput } from '@kidd-cli/core/ui'
import { getRunResults, getRuns, initializeSchema, openDatabase } from '@namescout/db'
import type { CheckResult, Run } from '@namescout/types'
import React, { useEffect, useState } from 'react'
import { match } from 'ts-pattern'

import { DetailView } from '../components/detail-view.js'
import { Logo } from '../components/logo.js'
import { ResultTable } from '../components/result-table.js'
import { RunList } from '../components/run-list.js'
import { StatusBar } from '../components/status-bar.js'

type View = 'runs' | 'results' | 'detail'

function Dashboard(): React.ReactElement {
  const { exit } = useApp()
  const [view, setView] = useState<View>('runs')
  const [runs, setRuns] = useState<Omit<Run, 'results'>[]>([])
  const [resultCounts, setResultCounts] = useState<{ total: number; available: number }[]>([])
  const [selectedRunResults, setSelectedRunResults] = useState<CheckResult[]>([])
  const [selectedResult, setSelectedResult] = useState<CheckResult | null>(null)

  useEffect(() => {
    const db = openDatabase()
    initializeSchema(db)
    const loadedRuns = getRuns(db)
    const counts = loadedRuns.map((run) => {
      const results = getRunResults(db, run.id)
      return {
        available: results.filter((r) => r.available).length,
        total: results.length,
      }
    })
    setRuns(loadedRuns)
    setResultCounts(counts)
    db.close()
  }, [])

  useInput((input, key) => {
    if (input === 'q') {
      exit()
      return
    }
    if ((input === 'b' || key.escape) && view !== 'runs') {
      match(view)
        .with('results', () => setView('runs'))
        .with('detail', () => setView('results'))
        .exhaustive()
    }
  })

  const handleRunSelect = (runIdStr: string): void => {
    const runId = Number(runIdStr)
    const db = openDatabase()
    const results = getRunResults(db, runId)
    db.close()
    setSelectedRunResults(results)
    setView('results')
  }

  const handleResultSelect = (indexStr: string): void => {
    const result = selectedRunResults[Number(indexStr)]
    if (result) {
      setSelectedResult(result)
      setView('detail')
    }
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Logo />
      {match(view)
        .with('runs', () => (
          <RunList runs={runs} resultCounts={resultCounts} onSelect={handleRunSelect} />
        ))
        .with('results', () => (
          <ResultTable results={selectedRunResults} onSelect={handleResultSelect} />
        ))
        .with('detail', () => (selectedResult ? <DetailView result={selectedResult} /> : null))
        .exhaustive()}
      <StatusBar view={view} />
    </Box>
  )
}

export default screen({
  description: 'Interactive dashboard — browse check results and past runs',
  fullscreen: true,
  name: '$default',
  render: Dashboard,
})
