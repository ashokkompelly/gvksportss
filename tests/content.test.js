import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pageDefaults, mergeContent } from '../shared/siteContent.js';

const temp = mkdtempSync(path.join(os.tmpdir(), 'gvk-content-'));
process.env.DATABASE_PATH = path.join(temp, 'content.sqlite');
process.env.APP_ORIGIN = 'http://localhost:5173';
const { app } = await import('../apps/api/src/app.js');
const { db } = await import('../apps/api/src/db/index.js');
const { hashPassword } = await import('../apps/api/src/modules/auth.js');
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = 'http://127.0.0.1:' + server.address().port + '/api';
let cookie = '';
async function request(route, method = 'GET', body, authenticated = true) {
  const response = await fetch(base + route, {
    method,
    headers: {
      Origin: process.env.APP_ORIGIN,
      'Content-Type': 'application/json',
      Cookie: authenticated ? cookie : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
test('Managed page content stays in sync with the public catalog', async (t) => {
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(temp, { recursive: true, force: true });
  });
  db.prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')").run(
    'Content Admin',
    'content@example.com',
    await hashPassword('content-test-password'),
  );
  cookie = (
    await request('/auth/login', 'POST', {
      email: 'content@example.com',
      password: 'content-test-password',
    })
  ).cookie;
  const pages = (await request('/admin/pages')).data;
  const saved = {};
  for (const slug of Object.keys(pageDefaults)) {
    const page = pages.find((page) => page.slug === slug);
    assert.ok(page, slug + ' is seeded');
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page, false)).status, 401);
    page.title = 'Edited ' + slug + ' page';
    page.body = 'Content managed through the portal for ' + slug;
    if (slug === 'home') {
      page.config.hero.slides[0].title = 'A new chess event headline';
      page.config.hero.slides[1].published = false;
      page.config.services.groups[0].items[0].label = 'Managed chess tournaments';
      page.config.process.enabled = false;
      page.config.training.trainerTitle = 'Personal training from the portal';
    }
    if (slug === 'about') {
      page.config.team.members.reverse();
      page.config.team.members[0].achievements = ['Updated professional achievement'];
      page.config.team.members[1].published = false;
      page.config.team.members.push({
        ...structuredClone(page.config.team.members[0]),
        id: 'new-member',
        name: 'New Team Member',
        published: true,
      });
    }
    if (slug === 'coaching') {
      page.config.cards[0].title = 'Updated chess coaching';
      page.config.cards[0].benefits = ['Managed coaching benefit'];
      page.config.cards[0].action = { label: 'Arrange a demo', href: '/contact?interest=Demo' };
    }
    if (slug === 'events') page.config.callout.title = 'Host your updated event';
    const response = await request('/admin/pages/' + page.id, 'PUT', page);
    assert.equal(response.status, 200, JSON.stringify(response.data));
    saved[slug] = response.data;
  }
  const publicPages = (await request('/catalog/pages')).data;
  for (const slug of Object.keys(saved))
    assert.equal(publicPages.find((page) => page.slug === slug).title, saved[slug].title);
  const home = publicPages.find((page) => page.slug === 'home');
  assert.equal(home.config.hero.slides.length, pageDefaults.home.config.hero.slides.length - 1);
  assert.equal(home.config.hero.slides[0].title, 'A new chess event headline');
  assert.equal(home.config.process.enabled, false);
  assert.equal(home.config.services.groups[0].items[0].label, 'Managed chess tournaments');
  const about = publicPages.find((page) => page.slug === 'about');
  assert.equal(about.config.team.members[0].name, 'Ashok');
  assert.deepEqual(about.config.team.members[0].achievements, ['Updated professional achievement']);
  assert.equal(about.config.team.members.at(-1).name, 'New Team Member');
  assert.ok(!about.config.team.members.some((member) => member.published === false));
  assert.equal(
    publicPages.find((page) => page.slug === 'coaching').config.cards[0].title,
    'Updated chess coaching',
  );
  assert.equal(
    publicPages.find((page) => page.slug === 'events').config.callout.title,
    'Host your updated event',
  );

  await t.test('empty lists and unpublishing do not restore defaults', async () => {
    const page = structuredClone(saved.about);
    page.config.team.members = [];
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page)).status, 200);
    const empty = (await request('/catalog/pages')).data.find((item) => item.slug === 'about');
    assert.deepEqual(mergeContent(pageDefaults.about.config, empty.config).team.members, []);
    page.published = false;
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page)).status, 200);
    assert.ok(!(await request('/catalog/pages')).data.some((item) => item.slug === 'about'));
    assert.ok(
      (await request('/admin/pages')).data.some((item) => item.slug === 'about' && !item.published),
    );
    assert.equal((await request('/admin/pages/' + saved.home.id, 'DELETE')).status, 200);
    assert.ok(!(await request('/catalog/pages')).data.some((item) => item.slug === 'home'));
  });
  await t.test('invalid shapes, duplicate IDs and unsafe links are rejected', async () => {
    const page = structuredClone(saved.coaching);
    page.config.cards = 'invalid';
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page)).status, 400);
    page.config = structuredClone(saved.coaching.config);
    page.config.cards.push({ ...page.config.cards[0] });
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page)).status, 400);
    page.config = structuredClone(saved.coaching.config);
    page.config.cards[0].action.href = 'javascript:alert(1)';
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page)).status, 400);
    page.config.cards[0].action.href = '/\\evil.example';
    assert.equal((await request('/admin/pages/' + page.id, 'PUT', page)).status, 400);
  });
  await t.test('generic updates preserve configuration and reserved slugs', async () => {
    const { config, ...page } = saved.events;
    page.title = 'Events title only';
    const response = await request('/admin/pages/' + page.id, 'PUT', page);
    assert.equal(response.status, 200);
    assert.deepEqual(response.data.config, config);
    assert.equal(
      (await request('/admin/pages/' + page.id, 'PUT', { ...page, slug: 'renamed-events' })).status,
      400,
    );
  });
  await t.test(
    'event listing create, publish, update and delete reach the public catalog',
    async () => {
      const created = await request('/admin/events', 'POST', {
        title: 'Portal chess tournament',
        sport: 'Chess',
        description: 'Created through event management',
        start: new Date(Date.now() + 86400000).toISOString(),
        capacity: 20,
        membersOnly: false,
        image: '/event-chess-poster.jpg',
        imageAlt: 'School chess tournament poster',
        published: false,
      });
      assert.equal(created.status, 201);
      for (const image of ['', undefined, 'javascript:alert(1)']) {
        assert.equal(
          (await request('/admin/events', 'POST', { ...created.data, image })).status,
          400,
        );
      }
      assert.equal(
        (await request('/admin/events/' + created.data.id, 'PUT', { ...created.data, image: '' }))
          .status,
        400,
      );
      assert.ok(
        !(await request('/catalog/events')).data.some((event) => event.id === created.data.id),
      );
      const published = { ...created.data, published: true, title: 'Updated portal tournament' };
      assert.equal((await request('/admin/events/' + published.id, 'PUT', published)).status, 200);
      assert.equal(
        (await request('/catalog/events')).data.find((event) => event.id === published.id).title,
        published.title,
      );
      const event = (await request('/catalog/events')).data.find(
        (event) => event.id === published.id,
      );
      assert.equal(event.image, '/event-chess-poster.jpg');
      assert.equal(event.imageAlt, 'School chess tournament poster');
      assert.equal(
        (
          await request('/admin/events/' + published.id, 'PUT', {
            ...published,
            image: '/updated-event-poster.jpg',
          })
        ).status,
        200,
      );
      assert.equal(
        (await request('/catalog/events')).data.find((event) => event.id === published.id).image,
        '/updated-event-poster.jpg',
      );
      assert.ok(
        !(await request('/catalog/pages')).data.find((page) => page.slug === 'events').config
          .fallbackImages,
      );
      assert.equal((await request('/admin/events/' + published.id, 'DELETE')).status, 200);
      assert.ok(
        !(await request('/catalog/events')).data.some((event) => event.id === published.id),
      );
    },
  );
  await t.test(
    'header branding, menu visibility, ordering and safe links are persisted',
    async () => {
      const header = structuredClone(saved.header);
      header.config.brand.name = 'Managed GVK';
      header.config.brand.image = '/icon-192.png';
      header.config.brand.tagline = 'Managed tagline';
      header.config.navigation.items.reverse();
      header.config.navigation.items[0].published = false;
      header.config.navigation.items.push({
        id: 'nav-external',
        label: 'Partner',
        href: 'https://example.com/events',
        icon: 'trophy',
        published: true,
        desktop: true,
        mobile: false,
        newTab: true,
      });
      header.config.account.guestAction.label = 'Enter portal';
      assert.equal((await request('/admin/pages/' + header.id, 'PUT', header)).status, 200);
      const result = (await request('/catalog/pages')).data.find((page) => page.slug === 'header');
      assert.equal(result.config.brand.image, '/icon-192.png');
      assert.equal(result.config.brand.name, 'Managed GVK');
      assert.equal(result.config.navigation.items[0].id, 'nav-gallery');
      assert.equal(result.config.navigation.items.at(-1).newTab, true);
      assert.equal(result.config.account.guestAction.label, 'Enter portal');
      const bad = structuredClone(header);
      bad.config.navigation.items[0].href = 'javascript:alert(1)';
      assert.equal((await request('/admin/pages/' + header.id, 'PUT', bad)).status, 400);
      bad.config.navigation.items[0].href = 'mailto:events@example.com';
      assert.equal((await request('/admin/pages/' + header.id, 'PUT', bad)).status, 200);
      bad.config.brand.image = 'mailto:events@example.com';
      assert.equal((await request('/admin/pages/' + header.id, 'PUT', bad)).status, 400);
      header.config.navigation.items = [];
      assert.equal((await request('/admin/pages/' + header.id, 'PUT', header)).status, 200);
      assert.deepEqual(
        (await request('/catalog/pages')).data.find((page) => page.slug === 'header').config
          .navigation.items,
        [],
      );
    },
  );
  await t.test('re-running migrations preserves edits and deletions', async () => {
    await import('../apps/api/src/db/seed.js?repeat');
    const pages = (await request('/admin/pages')).data;
    assert.equal(pages.find((page) => page.slug === 'events').title, 'Events title only');
    assert.deepEqual(pages.find((page) => page.slug === 'about').config.team.members, []);
    assert.ok(!pages.some((page) => page.slug === 'home'));
  });
});
