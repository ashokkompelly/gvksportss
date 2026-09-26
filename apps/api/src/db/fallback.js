import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { root } from '../config/env.js';
import { sqliteStore } from './sqlite-store.js';

export function openFallback() {
  const filename = path.resolve(
    root,
    process.env.SQLITE_FALLBACK_PATH || 'data/content-fallback.sqlite',
  );
  const database = new DatabaseSync(filename, { readOnly: true });
  // Validate at startup, before an outage exposes an invalid snapshot.
  database.prepare('SELECT id FROM resources LIMIT 1').get();
  database.prepare('SELECT filename FROM media LIMIT 1').get();
  return { ...sqliteStore(database), database };
}
