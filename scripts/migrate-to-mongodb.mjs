import { backup, DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { mongoStore, tables } from '../apps/api/src/db/store.js';
import { saveMedia, readMedia } from '../apps/api/src/db/media.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.resolve(root, process.argv[2] || 'data/gvk-development.sqlite');
const uploadsPath = path.resolve(root, process.argv[3] || 'data/uploads');
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env.');
if (!existsSync(sourcePath)) throw new Error('Source SQLite database does not exist.');
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const snapshotPath = path.join(root, 'data/exports', `before-atlas-${stamp}.sqlite`);
mkdirSync(path.dirname(snapshotPath), { recursive: true });
const source = new DatabaseSync(sourcePath, { readOnly: true });
try {
  await backup(source, snapshotPath);
} finally {
  source.close();
}
const snapshot = new DatabaseSync(snapshotPath);
const rows = {};
try {
  snapshot.exec('PRAGMA journal_mode=DELETE');
  if (snapshot.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
    throw new Error('SQLite integrity check failed.');
  if (snapshot.prepare('PRAGMA foreign_key_check').all().length)
    throw new Error('SQLite contains broken references.');
  const names = snapshot
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name);
  if (names.some((name) => !tables.includes(name)) || tables.some((name) => !names.includes(name)))
    throw new Error('Unexpected SQLite schema; migration stopped.');
  for (const table of tables)
    rows[table] = snapshot
      .prepare(`SELECT * FROM "${table}"`)
      .all()
      .map((row) => ({ ...row }));
} finally {
  snapshot.close();
}
console.log(`Local backup: ${path.relative(root, snapshotPath)}`);
const store = await mongoStore(
  process.env.MONGODB_URI,
  process.env.MONGODB_DATABASE || 'gvksportss',
);
try {
  const database = store.database;
  const keyFor = (table) => ({ sessions: 'token', migrations: 'version' })[table] || 'id';
  const verify = async () => {
    for (const table of tables) {
      const actual = await store.all(table);
      const key = keyFor(table);
      const ordered = (items) =>
        [...items].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
      if (!isDeepStrictEqual(ordered(actual), ordered(rows[table])))
        throw new Error(
          `Verification failed for ${table}; existing Atlas data was not overwritten.`,
        );
    }
  };
  let occupied = false;
  for (const table of tables) if (await store.count(table)) occupied = true;
  if (occupied) {
    await verify();
    console.log('Atlas already matches the SQLite snapshot; no records changed.');
  } else {
    await store.transaction(async () => {
      // The store transaction owns the shared write lock; insert through the store.
      for (const table of tables) {
        if (await store.count(table))
          throw new Error('Atlas is no longer empty. Migration stopped.');
        for (const row of rows[table]) await store.insert(table, row);
      }
    });
    await verify();
  }
  const referenced = new Set();
  for (const row of rows.resources)
    for (const match of row.data.matchAll(/\/uploads\/([a-zA-Z0-9_.-]+)/g))
      referenced.add(match[1]);
  const files = existsSync(uploadsPath)
    ? readdirSync(uploadsPath, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
    : [];
  for (const name of referenced)
    if (!files.includes(name)) throw new Error(`Referenced image is missing locally: ${name}`);
  for (const name of files) {
    const bytes = readFileSync(path.join(uploadsPath, name));
    const type = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
    }[path.extname(name).toLowerCase()];
    await saveMedia(database, name, bytes, type || 'application/octet-stream');
    if (!(await readMedia(database, name)).bytes.equals(bytes))
      throw new Error(`Image verification failed: ${name}`);
  }
  console.table(tables.map((table) => ({ collection: table, records: rows[table].length })));
  console.log(
    `Verified every field in all ${tables.length} collections and ${files.length} uploaded images.`,
  );
  console.log('Migration complete. Set DATABASE_PROVIDER=mongodb in .env and .env.development.');
} catch (error) {
  console.error(
    `Migration failed: ${error.name}. ${error.name === 'Error' ? error.message : 'Check Atlas access and database constraints.'}`,
  );
  process.exitCode = 1;
} finally {
  await store.close();
}
