import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { getDbPath } from '@namescout/db'

const SNAPSHOT_URL = 'https://pub-394f36a4383644b695b253701e1fe153.r2.dev/namescout.db'

export async function downloadSnapshot(destPath?: string): Promise<void> {
  const dbPath = destPath ?? getDbPath()
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const response = await fetch(SNAPSHOT_URL)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download snapshot: ${response.status}`)
  }

  const fileStream = createWriteStream(dbPath)
  await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream)
}

export function hasLocalDatabase(dbPath?: string): boolean {
  return fs.existsSync(dbPath ?? getDbPath())
}
