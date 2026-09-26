import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { sqliteStore } from '../apps/api/src/db/store.js';
import { migrateTeamAndPages } from '../apps/api/src/db/migrate-team-pages.js';

for (const members of [[{ id: 'custom-profile', name: 'Custom Person', published: false, achievements: ['Custom achievement'], image: '/uploads/custom.webp' }], []]) {
  test(`team migration preserves ${members.length ? 'custom profiles' : 'an intentionally empty team'} and does not rerun`, async () => {
    const db = new DatabaseSync(':memory:');
    db.exec('CREATE TABLE resources(id INTEGER PRIMARY KEY,kind TEXT,data TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE migrations(version INTEGER PRIMARY KEY);');
    const store = sqliteStore(db);
    try {
      const about = { slug: 'about', title: 'Custom About', body: 'Custom body', published: true, config: { team: { enabled: false, members } } };
      await store.insert('resources', { kind: 'pages', data: JSON.stringify(about) });
      const contact = { slug: 'contact', title: 'Custom Contact', body: 'Custom body', published: false, config: { eyebrow: 'CUSTOM' } };
      await store.insert('resources', { kind: 'pages', data: JSON.stringify(contact) });
      await migrateTeamAndPages(store);
      const team = await store.all('resources', { kind: 'team' });
      assert.equal(team.length, members.length);
      if (members.length) {
        const {legacyId, order, ...profile} = JSON.parse(team[0].data);
        assert.deepEqual({id:legacyId,...profile}, members[0]);
        assert.equal(order, 0);
      }
      const pages = (await store.all('resources', { kind: 'pages' })).map(row => JSON.parse(row.data));
      assert.equal(pages.find(page => page.slug === 'about').config.team.enabled, false);
      assert.equal(pages.find(page => page.slug === 'about').config.team.members, undefined);
      assert.equal(pages.find(page => page.slug === 'contact').title, 'Custom Contact');
      assert.equal(pages.find(page => page.slug === 'contact').published, false);
      assert.equal(pages.find(page => page.slug === 'contact').config.eyebrow, 'CUSTOM');
      assert.equal(pages.filter(page => page.slug === 'gallery').length, 1);
      await store.remove('resources', { kind: 'team' });
      await migrateTeamAndPages(store);
      assert.equal(await store.count('resources', { kind: 'team' }), 0);
    } finally { db.close(); }
  });
}
