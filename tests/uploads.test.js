import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

test('Admin image uploads validate files, persist images and serve them publicly', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'gvk-uploads-'));
  process.env.DATABASE_PATH = path.join(temp, 'test.sqlite');
  process.env.UPLOAD_DIR = path.join(temp, 'uploads');
  process.env.NODE_ENV = 'test';
  const { app } = await import('../apps/api/src/app.js');
  const { db } = await import('../apps/api/src/db/index.js');
  const { hashPassword } = await import('../apps/api/src/modules/auth.js');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const image = await sharp({
    create: { width: 60, height: 40, channels: 4, background: '#c9a54e80' },
  })
    .png()
    .toBuffer();
  const upload = (body, cookie = '') =>
    fetch(origin + '/api/admin/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', Cookie: cookie, Origin: origin },
      body,
    });
  try {
    db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run(
      'Upload Admin',
      'uploads@example.com',
      await hashPassword('upload-test-password'),
      'admin',
    );
    db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run(
      'Member',
      'member@example.com',
      await hashPassword('upload-test-password'),
      'member',
    );
    const login = async (email) => {
      const response = await fetch(origin + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'upload-test-password' }),
      });
      assert.equal(response.status, 200);
      return response.headers.get('set-cookie').split(';')[0];
    };
    assert.equal((await upload(image)).status, 401);
    assert.equal((await upload(image, await login('member@example.com'))).status, 403);
    const cookie = await login('uploads@example.com');
    assert.equal((await upload(Buffer.from('<svg onload="alert(1)"></svg>'), cookie)).status, 400);
    assert.equal((await upload(image.subarray(0, 24), cookie)).status, 400);
    assert.equal((await upload(Buffer.alloc(10 * 1024 * 1024 + 1), cookie)).status, 413);
    const response = await upload(image, cookie);
    assert.equal(response.status, 201);
    const saved = await response.json();
    assert.match(saved.url, /^\/uploads\/[a-f0-9-]+\.webp$/);
    assert.deepEqual([saved.width, saved.height], [60, 40]);
    const media = await fetch(origin + saved.url);
    assert.equal(media.status, 200);
    assert.match(media.headers.get('content-type'), /image\/webp/);
    assert.equal(media.headers.get('x-content-type-options'), 'nosniff');
    assert.equal((await sharp(Buffer.from(await media.arrayBuffer())).metadata()).hasAlpha, true);
    const event = await fetch(origin + '/api/admin/events', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Uploaded event',
        description: 'An event with its own uploaded image',
        sport: 'Chess',
        start: '2030-01-01T10:00:00Z',
        capacity: 10,
        image: saved.url,
        published: true,
      }),
    });
    assert.equal(event.status, 201);
    const catalog = await (await fetch(origin + '/api/catalog/events')).json();
    assert.equal(catalog.find((item) => item.title === 'Uploaded event').image, saved.url);
    assert.equal((await readdir(process.env.UPLOAD_DIR)).length, 1);
    assert.equal((await fetch(origin + '/uploads/missing.webp')).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await rm(temp, { recursive: true, force: true });
  }
});
