import assert from 'node:assert/strict';
import { app } from '../apps/api/src/app.js';
import { store } from '../apps/api/src/db/index.js';

assert.equal(store.backend, 'mongodb', 'This check requires MongoDB.');
const server = app.listen(0, '127.0.0.1');
try {
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(base + '/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, database: 'mongodb', readOnly: false });
  for (const kind of ['pages', 'events', 'programs', 'plans', 'slots', 'gallery', 'team']) {
    const response = await fetch(base + '/api/catalog/' + kind);
    assert.equal(response.status, 200);
    const actual = await response.json();
    const expected = (await store.all('resources', { kind })).filter(
      (row) => JSON.parse(row.data).published,
    );
    assert.deepEqual(actual.map((row) => row.id).sort(), expected.map((row) => row.id).sort());
    console.log(`${kind}: ${actual.length} published records served`);
  }
  const files = await store.database
    .collection('uploads.files')
    .find({}, { projection: { filename: 1 } })
    .toArray();
  for (const file of files) {
    const response = await fetch(base + '/uploads/' + file.filename);
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  console.log(`Atlas API health, all catalogs and ${files.length} uploaded images passed.`);
} finally {
  await new Promise((resolve) => server.close(resolve));
  await store.close();
}
