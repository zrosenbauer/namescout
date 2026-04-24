import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { getDbPath } from '@namescout/db'

const REPO = 'zrosenbauer/namescout'

export interface SnapshotInfo {
  readonly version: string
  readonly downloadUrl: string
}

export async function getLatestSnapshot(): Promise<SnapshotInfo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!response.ok) {
      return null
    }

    const release = (await response.json()) as {
      tag_name: string
      assets: { name: string; browser_download_url: string }[]
    }
    const asset = release.assets.find((entry) => entry.name === 'namescout.db')
    if (!asset) {
      return null
    }

    return {
      downloadUrl: asset.browser_download_url,
      version: release.tag_name,
    }
  } catch {
    return null
  }
}

export async function downloadSnapshot(url: string, destPath?: string): Promise<void> {
  const dbPath = destPath ?? getDbPath()
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download snapshot: ${response.status}`)
  }

  const fileStream = createWriteStream(dbPath)
  await pipeline(response.body as NodeJS.ReadableStream, fileStream)
}

export function hasLocalDatabase(dbPath?: string): boolean {
  return fs.existsSync(dbPath ?? getDbPath())
}
