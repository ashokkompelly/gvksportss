import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';
mkdirSync(path.dirname(config.database), { recursive: true });
export const db = new DatabaseSync(config.database);
db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS resources(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),slot_id INTEGER NOT NULL REFERENCES resources(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,slot_id));
CREATE TABLE IF NOT EXISTS registrations(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),event_id INTEGER NOT NULL REFERENCES resources(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,event_id));
CREATE TABLE IF NOT EXISTS memberships(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),plan_id INTEGER NOT NULL REFERENCES resources(id),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','cancelled')),valid_until TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_membership ON memberships(user_id) WHERE status IN ('pending','active');
CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,organization TEXT,message TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT NOT NULL,entity_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
`);
export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
export function resource(id, kind) {
  const row = db.prepare('SELECT * FROM resources WHERE id=? AND kind=?').get(id, kind);
  return row ? { id: row.id, ...JSON.parse(row.data) } : null;
}
export function resources(kind, all = false) {
  return db
    .prepare('SELECT * FROM resources WHERE kind=? ORDER BY id')
    .all(kind)
    .map((r) => ({ id: r.id, ...JSON.parse(r.data) }))
    .filter((r) => all || r.published);
}
export function audit(user, action, id) {
  db.prepare('INSERT INTO audit(user_id,action,entity_id) VALUES(?,?,?)').run(user.id, action, id);
}
