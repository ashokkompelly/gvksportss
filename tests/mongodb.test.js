import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

test(
  'Atlas: authentication, content, reservations, transactions and shared images',
  {
    skip: !process.env.MONGODB_URI,
    timeout: 180000,
  },
  async () => {
    // Never run fixtures against the user's database, even when .env is loaded.
    const testDatabase = 'gvk_test_' + randomUUID().replaceAll('-', '').slice(0, 24);
    process.env.DATABASE_PROVIDER = 'mongodb';
    process.env.MONGODB_DATABASE = testDatabase;
    process.env.NODE_ENV = 'development';
    process.env.APP_ORIGIN = 'http://localhost:5173';
    const { store, transaction } = await import('../apps/api/src/db/index.js');
    let server;
    try {
      const { app } = await import('../apps/api/src/app.js');
      const { organizeContent } = await import('../apps/api/src/db/organize-content.js');
      const legacyName = process.env.MONGODB_RESOURCE_COLLECTION || 'resources';
      const legacyCount = await store.database.collection(legacyName).countDocuments();
      await store.database
        .collection(legacyName)
        .insertOne({ _id: 9999, id: 9999, kind: 'unknown', data: '{}', created_at: '2026-01-01' });
      await assert.rejects(
        organizeContent(store.client, testDatabase, legacyName),
        /Unknown content kind/,
      );
      assert.equal(
        await store.database.collection('pages').countDocuments(),
        0,
        'Failed migration rolls back copied content',
      );
      assert.equal(
        await store.database.collection('_control').findOne({ _id: 'content_layout' }),
        null,
      );
      await store.database.collection(legacyName).deleteOne({ _id: 9999 });
      const organization = await organizeContent(store.client, testDatabase, legacyName);
      assert.equal(
        Object.values(organization.counts).reduce((a, b) => a + b, 0),
        legacyCount,
      );
      assert.equal(await store.database.collection(legacyName).countDocuments(), legacyCount);
      assert.equal(
        (await organizeContent(store.client, testDatabase, legacyName)).alreadyOrganized,
        true,
      );
      const { hashPassword } = await import('../apps/api/src/modules/auth.js');
      server = app.listen(0, '127.0.0.1');
      await new Promise((resolve) => server.once('listening', resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      async function request(route, method = 'GET', body, cookie = '') {
        const response = await fetch(base + '/api' + route, {
          method,
          headers: {
            Origin: process.env.APP_ORIGIN,
            'Content-Type': 'application/json',
            Cookie: cookie,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        return {
          status: response.status,
          data: await response.json(),
          cookie: response.headers.get('set-cookie')?.split(';')[0],
        };
      }
      assert.deepEqual((await request('/health')).data, { ok: true, database: 'mongodb' });
      assert.equal((await request('/admin/overview')).status, 401);
      await store.insert('users', {
        id: 100,
        name: 'Test Admin',
        email: 'admin@example.test',
        password: await hashPassword('test-admin-password'),
        role: 'admin',
      });
      const adminLogin = await request('/auth/login', 'POST', {
        email: 'admin@example.test',
        password: 'test-admin-password',
      });
      assert.equal(adminLogin.status, 200);
      const admin = adminLogin.cookie;
      assert.equal((await request('/auth/me', 'GET', undefined, admin)).data.user.id, 100);
      const member = await request('/auth/signup', 'POST', {
        name: 'Test Member',
        email: 'member@example.test',
        password: 'test-member-password',
      });
      assert.equal(member.status, 201);
      assert.equal(member.data.user.id, 101, 'IDs continue beyond imported IDs');
      assert.equal(
        (
          await request('/auth/signup', 'POST', {
            name: 'Test Member',
            email: 'member@example.test',
            password: 'test-member-password',
          })
        ).status,
        409,
      );
      assert.equal((await request('/admin/overview', 'GET', undefined, member.cookie)).status, 403);
      const pages = (await request('/admin/pages', 'GET', undefined, admin)).data;
      const home = pages.find((page) => page.slug === 'home');
      assert.ok(home);
      const updated = { ...home, title: 'Atlas content test' };
      assert.equal((await request(`/admin/pages/${home.id}`, 'PUT', updated, admin)).status, 200);
      assert.equal(
        (await request('/catalog/pages')).data.find((page) => page.id === home.id).title,
        updated.title,
      );
      const savedHome = await store.database.collection('pages').findOne({ id: home.id });
      assert.equal(savedHome.content.title, updated.title);
      assert.equal(typeof savedHome.content.config, 'object');
      assert.ok(savedHome.updated_at);
      assert.equal(savedHome.data, undefined, 'Content is a native object, not serialized JSON');
      assert.notEqual(
        JSON.parse((await store.database.collection(legacyName).findOne({ id: home.id })).data)
          .title,
        updated.title,
        'Legacy backup is not used for new writes',
      );
      const eventInput = {
        title: 'Atlas Test Event',
        sport: 'Chess',
        description: 'Integration test event',
        start: new Date(Date.now() + 86400000).toISOString(),
        location: 'Test venue',
        capacity: 2,
        membersOnly: false,
        published: true,
        image: '/brand-launch.jpeg',
      };
      const event = await request('/admin/events', 'POST', eventInput, admin);
      assert.equal(event.status, 201, JSON.stringify(event.data));
      assert.equal(
        (await store.database.collection('events').findOne({ id: event.data.id })).content.title,
        eventInput.title,
      );
      const first = await request('/registrations', 'POST', {
        id: event.data.id,
        name: 'First Guest',
        phone: '9999900001',
      });
      assert.equal(first.status, 201);
      assert.equal(
        (
          await request('/registrations', 'POST', {
            id: event.data.id,
            name: 'Duplicate Guest',
            phone: '9999900001',
          })
        ).status,
        409,
      );
      const results = await Promise.all(
        ['9999900002', '9999900003'].map((phone) =>
          request('/registrations', 'POST', { id: event.data.id, name: 'Another Guest', phone }),
        ),
      );
      assert.deepEqual(
        results.map((r) => r.status).sort(),
        [201, 409],
        'Concurrent requests cannot overbook',
      );
      assert.equal(
        (await request('/catalog/events')).data.find((row) => row.id === event.data.id).remaining,
        0,
      );
      assert.equal(
        (await request(`/admin/events/${event.data.id}`, 'DELETE', undefined, admin)).status,
        409,
      );
      const overview = await request('/admin/overview', 'GET', undefined, admin);
      assert.equal(overview.status, 200);
      assert.equal(
        overview.data.registrations.filter((row) => row.event_id === event.data.id).length,
        2,
      );
      assert.ok(overview.data.users.every((row) => !('password' in row)));
      const plan = (await request('/catalog/plans')).data[0];
      assert.equal(
        (await request('/member/memberships', 'POST', { id: plan.id }, member.cookie)).status,
        201,
      );
      assert.equal(
        (await request('/member/memberships', 'POST', { id: plan.id }, member.cookie)).status,
        409,
      );
      const memberships = (await request('/member', 'GET', undefined, member.cookie)).data
        .memberships;
      assert.equal(
        (
          await request(
            `/admin/memberships/${memberships[0].id}`,
            'PATCH',
            { status: 'active' },
            admin,
          )
        ).status,
        200,
      );
      const slotInput = {
        ...eventInput,
        title: 'Atlas Test Slot',
        end: new Date(Date.now() + 90000000).toISOString(),
        membersOnly: true,
      };
      const slot = await request('/admin/slots', 'POST', slotInput, admin);
      assert.equal(slot.status, 201, JSON.stringify(slot.data));
      assert.equal(
        (await request('/member/bookings', 'POST', { id: slot.data.id }, member.cookie)).status,
        201,
      );
      assert.equal(
        (await request('/member/bookings', 'POST', { id: slot.data.id }, member.cookie)).status,
        409,
      );
      assert.equal(
        (
          await request('/enquiries', 'POST', {
            name: 'Test Enquiry',
            email: 'enquiry@example.test',
            organization: '',
            message: 'Please send information.',
          })
        ).status,
        201,
      );
      await assert.rejects(
        transaction(async () => {
          await store.insert('enquiries', {
            name: 'Rollback',
            email: 'rollback@example.test',
            message: 'Must not persist',
          });
          throw new Error('Expected rollback');
        }),
        /Expected rollback/,
      );
      assert.equal(await store.count('enquiries', { email: 'rollback@example.test' }), 0);
      const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'blue' } })
        .png()
        .toBuffer();
      const upload = await fetch(base + '/api/admin/uploads', {
        method: 'POST',
        headers: {
          Origin: process.env.APP_ORIGIN,
          Cookie: admin,
          'Content-Type': 'application/octet-stream',
        },
        body: png,
      });
      assert.equal(upload.status, 201);
      const image = await upload.json();
      const downloaded = await fetch(base + image.url);
      assert.equal(downloaded.status, 200);
      assert.equal(downloaded.headers.get('content-type'), 'image/webp');
      assert.ok((await downloaded.arrayBuffer()).byteLength > 0);
      assert.equal(await store.database.collection('uploads.files').countDocuments(), 1);
      assert.equal((await request('/auth/logout', 'POST', {}, member.cookie)).status, 200);
      assert.equal((await request('/member', 'GET', undefined, member.cookie)).status, 401);
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      assert.equal(store.database.databaseName, testDatabase);
      assert.match(testDatabase, /^gvk_test_[a-f0-9]{24}$/);
      await store.database.dropDatabase();
      await store.close();
    }
  },
);
