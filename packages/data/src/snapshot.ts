import { execSync } from 'node:child_process'
import fs, { createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import { getDbPath } from '@namescout/db'

const BASE_URL = 'https://pub-394f36a4383644b695b253701e1fe153.r2.dev'
const SNAPSHOT_URL = `${BASE_URL}/namescout.db`
const SNAPSHOT_ZSTD_URL = `${BASE_URL}/namescout.db.zst`

function hasZstd(): boolean {
  try {
    execSync('zstd --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export async function downloadSnapshot(destPath?: string): Promise<void> {
  const dbPath = destPath ?? getDbPath()
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (hasZstd()) {
    const downloaded = await tryDownloadZstd(dbPath)
    if (downloaded) {
      return
    }
  }

  await downloadRaw(dbPath)
}

async function tryDownloadZstd(dbPath: string): Promise<boolean> {
  const zstPath = `${dbPath}.zst`

  try {
    const response = await fetch(SNAPSHOT_ZSTD_URL)
    if (!response.ok || !response.body) {
      return false
    }

    const fileStream = createWriteStream(zstPath)
    await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream)

    execSync(`zstd -d --rm -f "${zstPath}" -o "${dbPath}"`, { stdio: 'ignore' })
    return true
  } catch {
    // Clean up partial files
    try {
      fs.unlinkSync(zstPath)
    } catch {
      // Ignore
    }
    return false
  }
}

async function downloadRaw(dbPath: string): Promise<void> {
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
