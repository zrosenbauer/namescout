import type Database from 'better-sqlite3'

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS package_embeddings USING vec0(
      id INTEGER PRIMARY KEY,
      embedding int8[384]
    );

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL CHECK (source IN ('cli', 'file'))
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL REFERENCES runs(id),
      name TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 0,
      squatted INTEGER,
      risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
      string_matches TEXT NOT NULL DEFAULT '[]',
      semantic_matches TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}
