import { DatabaseSync } from 'node:sqlite';
import { sqliteStore } from './sqlite-store.js';
export function createSqliteStore(filename) {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS resources(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),slot_id INTEGER NOT NULL REFERENCES resources(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,slot_id));
CREATE TABLE IF NOT EXISTS registrations(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),event_id INTEGER NOT NULL REFERENCES resources(id),name TEXT,phone TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,event_id),UNIQUE(event_id,phone));
CREATE TABLE IF NOT EXISTS memberships(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),plan_id INTEGER NOT NULL REFERENCES resources(id),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','cancelled')),valid_until TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_membership ON memberships(user_id) WHERE status IN ('pending','active');
CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,organization TEXT,message TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT NOT NULL,entity_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
`);
  db.exec(
    'CREATE TABLE IF NOT EXISTS media(filename TEXT PRIMARY KEY, content_type TEXT NOT NULL, bytes BLOB NOT NULL); CREATE TABLE IF NOT EXISTS snapshot(created_at TEXT NOT NULL);',
  );
  return { ...sqliteStore(db), database: db };
}
