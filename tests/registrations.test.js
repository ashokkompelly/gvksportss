import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('Guest registration validation, capacity and admin management', async () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'gvk-registration-'));
  process.env.MONGODB_DATABASE = 'gvk_test_' + randomUUID().replaceAll('-', '').slice(0, 24);
  process.env.APP_ORIGIN = 'http://localhost:5173';
  const { store } = await import('../apps/api/src/db/index.js');
  const { app } = await import('../apps/api/src/app.js');
  const { hashPassword } = await import('../apps/api/src/modules/auth.js');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  async function request(route, method = 'GET', body, cookie = '') {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Origin: process.env.APP_ORIGIN,
        Cookie: cookie,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      data: await response.json(),
      cookie: response.headers.get('set-cookie')?.split(';')[0],
    };
  }
  try {
    await store.insert('users', {
      name: 'Admin',
      email: 'registration-admin@example.com',
      password: await hashPassword('registration-password'),
      role: 'admin',
    });
    const admin = await request('/auth/login', 'POST', {
      email: 'registration-admin@example.com',
      password: 'registration-password',
    });
    const eventData = {
      title: 'Open tournament',
      sport: 'Chess',
      description: 'An open tournament',
      start: new Date(Date.now() + 86400000).toISOString(),
      location: 'Academy',
      capacity: 2,
      image: '/test.jpg',
      published: true,
    };
    const event = await request('/admin/events', 'POST', eventData, admin.cookie);
    assert.equal(event.status, 201);
    const details = { id: event.data.id, name: 'Guest Player', phone: '98765 43210' };
    assert.equal(
      (await request('/registrations', 'POST', { ...details, phone: 'invalid' })).status,
      400,
    );
    assert.equal((await request('/registrations', 'POST', { ...details, name: '' })).status, 400);
    assert.equal((await request('/registrations', 'POST', details)).status, 201);
    assert.equal(
      (await request('/registrations', 'POST', { ...details, phone: '9876543210' })).status,
      409,
    );
    const catalog = await request('/catalog/events');
    assert.equal(catalog.data.find((item) => item.id === event.data.id).remaining, 1);
    assert.ok(!JSON.stringify(catalog.data).includes('9876543210'));
    assert.equal((await request('/admin/overview')).status, 401);
    const overview = await request('/admin/overview', 'GET', undefined, admin.cookie);
    const row = overview.data.registrations.find((item) => item.event_id === event.data.id);
    assert.equal(row.name, details.name);
    assert.equal(row.phone, '9876543210');
    assert.equal(row.event_id, event.data.id);
    assert.equal(row.item.title, eventData.title);
    const registeredAt = Date.parse(row.created_at.replace(' ', 'T') + 'Z');
    assert.ok(Number.isFinite(registeredAt));
    assert.ok(Math.abs(Date.now() - registeredAt) < 60_000);
    assert.equal((await request('/admin/registrations/' + row.id, 'PATCH', details)).status, 401);
    assert.equal(
      (
        await request(
          '/admin/registrations/' + row.id,
          'PATCH',
          { name: 'Updated Player', phone: '9876543211' },
          admin.cookie,
        )
      ).status,
      200,
    );
    assert.equal((await request('/registrations', 'POST', details)).status, 201);
    assert.equal(
      (await request('/registrations', 'POST', { ...details, phone: '9876543212' })).status,
      409,
    );
    assert.equal(
      (
        await request(
          '/admin/events/' + event.data.id,
          'PUT',
          { ...eventData, capacity: 1 },
          admin.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (await request('/admin/events/' + event.data.id, 'DELETE', undefined, admin.cookie)).status,
      409,
    );
    assert.equal(
      (await request('/admin/registrations/' + row.id, 'DELETE', undefined, admin.cookie)).status,
      200,
    );
    assert.equal(
      (await request('/registrations', 'POST', { ...details, phone: '9876543212' })).status,
      201,
    );
    for (const changes of [
      { published: false },
      { membersOnly: true },
      { start: '2020-01-01T00:00:00Z' },
    ]) {
      const restricted = await request(
        '/admin/events',
        'POST',
        { ...eventData, ...changes },
        admin.cookie,
      );
      const result = await request('/registrations', 'POST', {
        ...details,
        id: restricted.data.id,
      });
      assert.equal(
        result.status,
        changes.published === false ? 404 : changes.membersOnly ? 403 : 409,
      );
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await store.database.dropDatabase();
    await store.close();
    rmSync(temp, { recursive: true, force: true });
  }
});
