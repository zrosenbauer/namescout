import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import Database from 'better-sqlite3'
import * as sqliteVec from 'sqlite-vec'

const DB_DIR = path.join(os.homedir(), '.namescout')
const DB_PATH = path.join(DB_DIR, 'namescout.db')

export function getDbPath(): string {
  return DB_PATH
}

export function openDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? DB_PATH
  const dir = path.dirname(resolvedPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const db = new Database(resolvedPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  sqliteVec.load(db)

  return db
}
