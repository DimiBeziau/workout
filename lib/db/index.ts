import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

declare global {
  // eslint-disable-next-line no-var
  var __db: BetterSQLite3Database<typeof schema> | undefined
}

function initDb() {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'dev.db')
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS session_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cardio', 'renfo')),
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      session_template_id INTEGER REFERENCES session_templates(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(user_id, week_start, day_of_week)
    );
  `)

  const db = drizzle(sqlite, { schema })

  // Seed admin user if no users exist
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  const hash = bcrypt.hashSync(adminPassword, 10)
  const result = sqlite
    .prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)')
    .run(adminUsername, hash)
  if (result.changes > 0) {
    console.log(`[DB] Created admin user: ${adminUsername}`)
  }

  return db
}

export const db = globalThis.__db ?? (globalThis.__db = initDb())
