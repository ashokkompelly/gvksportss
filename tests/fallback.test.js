import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createSqliteStore } from '../apps/api/src/db/sqlite.js';
import { failoverStore } from '../apps/api/src/db/failover.js';

const run = promisify(execFile);
const networkError = () => Object.assign(new Error('offline'), { name: 'MongoNetworkError' });

test('runtime reads switch once; failed writes are never replayed', async () => {
  let reads = 0;
  let writes = 0;
  const fallback = {
    backend: 'sqlite',
    all: async () => ['snapshot'],
    insert: async () => {
      writes++;
    },
  };
  const primary = {
    backend: 'mongodb',
    all: async () => {
      reads++;
      throw networkError();
    },
  };
  const store = failoverStore(primary, fallback);
  assert.deepEqual(await store.all('resources'), ['snapshot']);
  assert.deepEqual(await store.all('resources'), ['snapshot']);
  assert.equal(reads, 1);
  await assert.rejects(store.insert('resources', {}), { status: 503 });
  assert.equal(writes, 0);
  const failedWrite = failoverStore(
    {
      backend: 'mongodb',
      insert: async () => {
        throw networkError();
      },
    },
    fallback,
  );
  await assert.rejects(failedWrite.insert('resources', {}), { status: 503 });
  assert.equal(failedWrite.backend, 'sqlite');
  assert.equal(writes, 0);
});

test('validation errors do not switch databases; transactions never mix stores', async () => {
  const duplicate = Object.assign(new Error('duplicate'), { code: 11000 });
  const store = failoverStore(
    {
      backend: 'mongodb',
      insert: async () => {
        throw duplicate;
      },
    },
    { backend: 'sqlite' },
  );
  await assert.rejects(store.insert('users', {}), { code: 11000 });
  assert.equal(store.backend, 'mongodb');
  let fallbackReads = 0;
  const transactional = failoverStore(
    {
      backend: 'mongodb',
      transaction: async (fn) => fn(),
      all: async () => {
        throw networkError();
      },
    },
    {
      backend: 'sqlite',
      all: async () => {
        fallbackReads++;
      },
    },
  );
  await assert.rejects(
    transactional.transaction(() => transactional.all('resources')),
    { status: 503 },
  );
  assert.equal(fallbackReads, 0);
});

for (const uri of ['', 'mongodb://127.0.0.1:1/?directConnection=true']) {
  test(`public content and images remain available with ${uri ? 'unreachable' : 'missing'} MongoDB`, async () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'gvk-fallback-'));
    const filename = path.join(directory, 'snapshot.sqlite');
    const local = createSqliteStore(filename);
    await local.insert('resources', {
      id: 1,
      kind: 'pages',
      data: JSON.stringify({ slug: 'home', title: 'Saved production content', published: true }),
    });
    local.database
      .prepare('INSERT INTO media VALUES(?,?,?)')
      .run('test.webp', 'image/webp', Buffer.from('image-fixture'));
    await local.close();
    try {
      const result = await run(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
        import assert from 'node:assert/strict';
        const { app } = await import('./apps/api/src/app.js');
        const { closeDatabase } = await import('./apps/api/src/db/index.js');
        const server = app.listen(0, '127.0.0.1');
        await new Promise(r => server.once('listening', r));
        const base = 'http://127.0.0.1:' + server.address().port;
        try {
          const health = await (await fetch(base + '/api/health')).json();
          assert.deepEqual(health, {ok:true, database:'sqlite', readOnly:true});
          const pages = await (await fetch(base + '/api/catalog/pages', {headers:{Cookie:'gvk_session=old-session'}})).json();
          assert.equal(pages[0].title, 'Saved production content');
          const image = await fetch(base + '/uploads/test.webp');
          assert.equal(image.status, 200);
          assert.equal(await image.text(), 'image-fixture');
          assert.equal((await fetch(base + '/api/registrations', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'})).status, 503);
          assert.equal((await fetch(base + '/api/admin/pages')).status, 503);
          console.log('fallback passed');
        } finally { await new Promise(r => server.close(r)); await closeDatabase(); }
      `,
        ],
        {
          env: {
            ...process.env,
            MONGODB_URI: uri,
            SQLITE_FALLBACK: 'true',
            SQLITE_FALLBACK_PATH: filename,
            NODE_ENV: 'test',
          },
          timeout: 15000,
        },
      );
      assert.match(result.stdout, /fallback passed/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
