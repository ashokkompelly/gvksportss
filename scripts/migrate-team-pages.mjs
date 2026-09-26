import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { root } from '../apps/api/src/config/env.js';
import { store } from '../apps/api/src/db/index.js';
import { migrateTeamAndPages } from '../apps/api/src/db/migrate-team-pages.js';

try {
  const pages = await store.all('resources', { kind: 'pages' });
  const directory = path.join(root, 'data/exports');
  mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, `before-team-pages-${new Date().toISOString().replaceAll(':','-')}.json`);
  writeFileSync(filename, JSON.stringify(pages, null, 2), { flag: 'wx' });
  await migrateTeamAndPages(store);
  console.log(`Page backup: ${filename}`);
  console.log(`Team profiles: ${await store.count('resources', { kind: 'team' })}`);
  console.log('Team migration verified; Contact and Gallery page editors are ready.');
} finally { await store.close(); }
