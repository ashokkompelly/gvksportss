import { MongoClient } from 'mongodb';
import { mkdirSync, existsSync, renameSync, rmSync } from 'node:fs';
import { backup, DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { root } from '../apps/api/src/config/env.js';
import { createSqliteStore } from '../apps/api/src/db/sqlite.js';
import { categorizedContent } from '../apps/api/src/db/content-store.js';
import { readMedia } from '../apps/api/src/db/media.js';

if (!process.env.MONGODB_URI)
  throw new Error('Set MONGODB_URI to export the current site content.');
const target = path.join(root, 'data/content-fallback.sqlite');
const temporary = target + '.tmp';
mkdirSync(path.dirname(target), { recursive: true });
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
let local;
try {
  await client.connect();
  const database = client.db(process.env.MONGODB_DATABASE || 'gvk_db');
  rmSync(temporary, { force: true });
  local = createSqliteStore(temporary);
  const session = client.startSession();
  const images = new Set();
  let count = 0;
  try {
    await session.withTransaction(
      async () => {
        // Reset the output if MongoDB retries this read-only transaction.
        local.database.exec('DELETE FROM resources; DELETE FROM media; DELETE FROM snapshot;');
        images.clear();
        count = 0;
        const categorized = await database
          .collection('_control')
          .findOne({ _id: 'content_layout', version: 2 }, { session });
        const rows = categorized
          ? await categorizedContent(database, () => ({ session })).all({}, { id: 1 })
          : await database
              .collection(process.env.MONGODB_RESOURCE_COLLECTION || 'resources')
              .find({}, { session })
              .toArray();
        const stripDrafts = (value) => {
          if (Array.isArray(value))
            return value.filter((item) => item?.published !== false).map(stripDrafts);
          if (value && typeof value === 'object')
            return Object.fromEntries(
              Object.entries(value).map(([key, item]) => [key, stripDrafts(item)]),
            );
          return value;
        };
        for (const row of rows) {
          const content = JSON.parse(row.data);
          if (!content.published) continue;
          const data = JSON.stringify(stripDrafts(content));
          await local.insert('resources', {
            id: row.id,
            kind: row.kind,
            data,
            created_at: row.created_at || new Date().toISOString(),
          });
          for (const match of data.matchAll(/\/uploads\/([a-zA-Z0-9_.-]+)/g)) images.add(match[1]);
          count++;
        }
      },
      { readConcern: { level: 'snapshot' } },
    );
  } finally {
    await session.endSession();
  }
  for (const filename of images) {
    const image = await readMedia(database, filename);
    if (!image) throw new Error(`Missing referenced image: ${filename}`);
    local.database
      .prepare('INSERT INTO media VALUES(?,?,?)')
      .run(filename, image.contentType, image.bytes);
  }
  if (!count) throw new Error('No published content found; the existing fallback was preserved.');
  local.database.prepare('INSERT INTO snapshot VALUES(?)').run(new Date().toISOString());
  if (local.database.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok')
    throw new Error('Snapshot integrity check failed');
  await local.close();
  local = null;
  if (existsSync(target)) {
    // SQLite backup can update an open read-only snapshot on Windows; renaming cannot.
    const snapshot = new DatabaseSync(temporary, { readOnly: true });
    try {
      await backup(snapshot, target);
    } finally {
      snapshot.close();
    }
  } else renameSync(temporary, target);
  console.log(
    `Saved ${count} published content records and ${images.size} images to data/content-fallback.sqlite. No accounts or personal records were exported.`,
  );
} finally {
  await local?.close();
  await client.close();
  rmSync(temporary, { force: true });
}
