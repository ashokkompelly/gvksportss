import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogCache } from '../apps/web/src/lib/catalog-cache.js';
import { catalogCacheHeaders } from '../apps/api/src/modules/catalog-cache.js';
import { mongoReservationCounts } from '../apps/api/src/db/reservation-counts.js';
import { mongoStore } from '../apps/api/src/db/store.js';
import { MongoClient } from 'mongodb';
import { execFileSync } from 'node:child_process';

test('duplicate public reads share a request and expire after 30 seconds', async () => {
  let time = 1000,
    calls = 0;
  const cache = createCatalogCache({ now: () => time });
  const read = async () => {
    calls++;
    return [{ title: 'Published page' }];
  };
  const [a, b] = await Promise.all([
    cache.read('/catalog/pages', read),
    cache.read('/catalog/pages', read),
  ]);
  assert.deepEqual(a, b);
  assert.equal(calls, 1);
  assert.deepEqual(cache.peek('/catalog/pages'), a);
  await cache.read('/catalog/pages', read);
  assert.equal(calls, 1);
  time += 30001;
  assert.equal(cache.peek('/catalog/pages'), null);
  await cache.read('/catalog/pages', read);
  assert.equal(calls, 2);
});
test('admin, session, member and live availability responses are never retained', async () => {
  const cache = createCatalogCache();
  let calls = 0;
  const read = async () => ++calls;
  for (const path of ['/admin/pages', '/auth/me', '/member', '/catalog/events', '/catalog/slots']) {
    const a = await cache.read(path, read),
      b = await cache.read(path, read);
    assert.notEqual(a, b);
    assert.equal(cache.peek(path), null);
  }
});
test('an old response cannot repopulate the cache after an admin save', async () => {
  const cache = createCatalogCache();
  let finish;
  const old = cache.read(
    '/catalog/pages',
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  await Promise.resolve();
  cache.invalidate();
  let url;
  await cache.read('/catalog/pages', async (p) => {
    url = p;
    return ['new'];
  });
  finish(['old']);
  await old;
  assert.deepEqual(cache.peek('/catalog/pages'), ['new']);
  assert.match(url, /\?fresh=/);
});
test('refreshing one key does not strand another pending request; failures retry', async () => {
  const cache = createCatalogCache();
  let finish,
    calls = 0;
  const pending = cache.read(
    '/catalog/team',
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  await Promise.resolve();
  cache.invalidate('/catalog/pages');
  finish(['team']);
  await pending;
  assert.deepEqual(cache.peek('/catalog/team'), ['team']);
  await assert.rejects(
    cache.read('/catalog/pages', async () => {
      throw new Error('network');
    }),
  );
  assert.deepEqual(
    await cache.read('/catalog/pages', async () => {
      calls++;
      return ['recovered'];
    }),
    ['recovered'],
  );
  assert.equal(calls, 1);
});
test('CDN caching excludes private, fresh, fallback and capacity responses', () => {
  function headers(kind, { cookie = '', fresh = '', backend = 'mongodb' } = {}) {
    const out = { 'Cache-Control': 'no-store' };
    catalogCacheHeaders(
      { params: { kind }, headers: { cookie }, query: { fresh } },
      {
        setHeader: (k, v) => {
          out[k] = v;
        },
      },
      backend,
    );
    return out;
  }
  assert.equal(headers('pages')['Vercel-CDN-Cache-Control'], 'public, max-age=30');
  for (const [kind, options] of [
    ['events', {}],
    ['slots', {}],
    ['pages', { cookie: 'session=x' }],
    ['pages', { fresh: '123' }],
    ['pages', { backend: 'sqlite' }],
  ]) {
    assert.equal(headers(kind, options)['Cache-Control'], 'no-store');
    assert.equal(headers(kind, options)['Vercel-CDN-Cache-Control'], undefined);
  }
});
test('availability totals use one grouped query with no attendee fields', async () => {
  let calls = 0,
    pipeline;
  const db = {
    collection: (name) => {
      assert.equal(name, 'registrations');
      return {
        aggregate: (p) => {
          pipeline = p;
          calls++;
          return {
            toArray: async () => [
              { _id: 10, total: 2 },
              { _id: 11, total: 4 },
            ],
          };
        },
      };
    },
  };
  assert.deepEqual(await mongoReservationCounts(db, 'registrations', 'event_id', [10, 11]), {
    10: 2,
    11: 4,
  });
  assert.equal(calls, 1);
  assert.deepEqual(pipeline, [
    { $match: { event_id: { $in: [10, 11] } } },
    { $group: { _id: '$event_id', total: { $sum: 1 } } },
  ]);
  assert.deepEqual(await mongoReservationCounts(db, 'registrations', 'event_id', []), {});
  assert.equal(calls, 1);
  await assert.rejects(mongoReservationCounts(db, 'users', 'email', [1]), /Unsupported/);
});
test('Vercel connection does not issue index or migration writes and caches legacy layout', async (t) => {
  let layoutReads = 0;
  const db = {
    collection: (name) => ({
      findOne: async (filter) => {
        assert.equal(name, '_control');
        if (filter._id === 'writes') return { _id: 'writes', version: 0 };
        layoutReads++;
        return null;
      },
      find: () => ({ sort: () => ({ toArray: async () => [] }) }),
      createIndex: () => {
        throw new Error('Unexpected index creation');
      },
      updateOne: () => {
        throw new Error('Unexpected write');
      },
    }),
  };
  t.mock.method(MongoClient.prototype, 'connect', async function () {
    return this;
  });
  t.mock.method(MongoClient.prototype, 'db', () => db);
  t.mock.method(MongoClient.prototype, 'close', async () => {});
  const store = await mongoStore('mongodb://localhost:27017', 'test', { ensureSchema: false });
  await store.all('resources', { kind: 'pages' });
  await store.all('resources', { kind: 'pages' });
  assert.equal(layoutReads, 1);
  await store.close();
});
test('Vercel defaults to explicit database setup, with an opt-in escape hatch', () => {
  const run = (value) =>
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import {automaticDatabaseSetup as a} from './apps/api/src/config/database-setup.js';console.log(a)",
      ],
      { env: { ...process.env, VERCEL: '1', MONGODB_AUTO_SETUP: value }, encoding: 'utf8' },
    ).trim();
  assert.equal(run(''), 'false');
  assert.equal(run('true'), 'true');
});
