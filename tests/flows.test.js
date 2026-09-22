import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const temp = mkdtempSync(path.join(os.tmpdir(), 'gvk-test-'));
process.env.DATABASE_PATH = path.join(temp, 'test.sqlite');
process.env.APP_ORIGIN = 'http://localhost:5173';
const { app } = await import('../apps/api/src/app.js');
const { db } = await import('../apps/api/src/db/index.js');
const { hashPassword } = await import('../apps/api/src/modules/auth.js');
const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const base = 'http://127.0.0.1:' + server.address().port;
async function request(url, method = 'GET', body, cookie = '', origin = 'http://localhost:5173') {
  const r = await fetch(base + '/api' + url, {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    data: await r.json(),
    cookie: r.headers.get('set-cookie')?.split(';')[0],
  };
}
test('Complete access, content, booking and membership flow', async () => {
  try {
    assert.equal((await request('/admin/overview')).status, 401);
    const user = await request('/auth/signup', 'POST', {
      name: 'Test Member',
      email: 'member@example.com',
      password: 'test-password-123',
    });
    assert.equal(user.status, 201);
    const uc = user.cookie;
    assert.equal((await request('/admin/pages', 'POST', { title: 'No' }, uc)).status, 403);
    assert.equal(
      (await request('/auth/logout', 'POST', {}, uc, 'https://evil.example')).status,
      403,
    );
    db.prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')").run(
      'Admin',
      'admin@example.com',
      await hashPassword('test-admin-password'),
    );
    const a = await request('/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'test-admin-password',
    });
    assert.equal(a.status, 200);
    const ac = a.cookie;
    const start = new Date(Date.now() + 86400000).toISOString(),
      end = new Date(Date.now() + 90000000).toISOString();
    const slot = await request(
      '/admin/slots',
      'POST',
      {
        title: 'Chess foundations',
        sport: 'Chess',
        start,
        end,
        location: 'Test academy',
        capacity: 1,
        published: true,
        membersOnly: false,
      },
      ac,
    );
    assert.equal(slot.status, 201);
    assert.equal((await request('/member/bookings', 'POST', { id: slot.data.id }, uc)).status, 201);
    assert.equal((await request('/member/bookings', 'POST', { id: slot.data.id }, uc)).status, 409);
    const u2 = await request('/auth/signup', 'POST', {
      name: 'Other Member',
      email: 'other@example.com',
      password: 'test-password-456',
    });
    assert.equal(
      (await request('/member/bookings', 'POST', { id: slot.data.id }, u2.cookie)).status,
      409,
    );
    const overview = await request('/member', 'GET', null, uc);
    const bid = overview.data.bookings[0].id;
    assert.equal((await request('/member/bookings/' + bid, 'DELETE', null, u2.cookie)).status, 404);
    assert.equal((await request('/member/bookings/' + bid, 'DELETE', null, uc)).status, 200);
    assert.equal(
      (await request('/member/bookings', 'POST', { id: slot.data.id }, u2.cookie)).status,
      201,
    );
    const plan = await request(
      '/admin/plans',
      'POST',
      {
        title: 'Chess monthly',
        description: 'Test membership plan',
        price: 1000,
        durationDays: 30,
        published: true,
      },
      ac,
    );
    assert.equal(plan.status, 201);
    assert.equal(
      (await request('/member/memberships', 'POST', { id: plan.data.id }, uc)).status,
      201,
    );
    const event = await request(
      '/admin/events',
      'POST',
      {
        title: 'Members tournament',
        sport: 'Chess',
        description: 'Test event description',
        start,
        location: 'Test academy',
        capacity: 10,
        membersOnly: true,
        published: true,
      },
      ac,
    );
    assert.equal(
      (await request('/member/registrations', 'POST', { id: event.data.id }, uc)).status,
      403,
    );
    const m = await request('/member', 'GET', null, uc);
    assert.equal(
      (
        await request(
          '/admin/memberships/' + m.data.memberships[0].id,
          'PATCH',
          { status: 'active' },
          ac,
        )
      ).status,
      200,
    );
    assert.equal(
      (await request('/member/registrations', 'POST', { id: event.data.id }, uc)).status,
      201,
    );
    assert.equal((await request('/admin/events/' + event.data.id, 'DELETE', null, ac)).status, 409);
    assert.equal((await request('/auth/logout', 'POST', {}, uc)).status, 200);
    assert.equal((await request('/member', 'GET', null, uc)).status, 401);
  } finally {
    await new Promise((r) => server.close(r));
    db.close();
    rmSync(temp, { recursive: true, force: true });
  }
});
