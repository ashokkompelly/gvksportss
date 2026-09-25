import { backup, DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.resolve(root, process.argv[2] || 'data/gvk-development.sqlite');
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const destinationPath = path.resolve(
  root,
  process.argv[3] || `data/exports/gvk-production-${timestamp}.sqlite`,
);

if (!existsSync(sourcePath)) throw new Error(`Source database does not exist: ${sourcePath}`);
if (existsSync(destinationPath))
  throw new Error(`Destination already exists; refusing to overwrite it: ${destinationPath}`);
mkdirSync(path.dirname(destinationPath), { recursive: true });

// SQLite reads committed changes from both the main file and its WAL.
// Do not import the app here: exporting must never run seeds or migrations.
const source = new DatabaseSync(sourcePath, { readOnly: true });
try {
  await backup(source, destinationPath);
} finally {
  source.close();
}

const snapshot = new DatabaseSync(destinationPath);
try {
  // Make the export a standalone file, with no WAL/SHM companions required.
  snapshot.exec('PRAGMA journal_mode=DELETE');
  const integrity = snapshot.prepare('PRAGMA integrity_check').all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok')
    throw new Error('Database integrity check failed. Do not deploy this export.');
  const counts = snapshot
    .prepare('SELECT kind, count(*) AS count FROM resources GROUP BY kind')
    .all();
  console.log('Complete SQLite snapshot created and integrity verified.');
  console.log(`Source: ${sourcePath}`);
  console.log(`Export: ${destinationPath}`);
  console.table(counts);
  console.log(
    'This includes accounts and bookings. Back up production before replacing its database.',
  );
  console.log('Uploaded images are separate files and must be transferred separately.');
} finally {
  snapshot.close();
}
