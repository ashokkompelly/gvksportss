import { initialTeamMembers, pageDefaults } from '../../../../shared/siteContent.js';
import { isDeepStrictEqual } from 'node:util';

export async function migrateTeamAndPages(store) {
  return store.transaction(async () => {
    if (await store.one('migrations', { version: 20 })) return;
    const pages = await store.all('resources', { kind: 'pages' });
    const about = pages.find((row) => JSON.parse(row.data).slug === 'about');
    if (about) {
      const page = JSON.parse(about.data);
      const members = page.config?.team?.members ?? initialTeamMembers;
      if (await store.count('resources', { kind: 'team' }))
        throw new Error('Team migration found existing profiles; refusing to duplicate them.');
      for (const [order, member] of members.entries()) {
        const { id: legacyId, ...profile } = member;
        await store.insert('resources', {
          kind: 'team',
          data: JSON.stringify({ ...profile, legacyId, order }),
          created_at: about.created_at,
        });
      }
      const migrated = (await store.all('resources', { kind: 'team' })).map(row => JSON.parse(row.data)).sort((a,b) => a.order - b.order);
      const restored = migrated.map(({ legacyId, order, ...profile }) => ({ ...profile, ...(legacyId === undefined ? {} : { id: legacyId }) }));
      if (!isDeepStrictEqual(members, restored)) throw new Error('Team migration verification failed.');
      if (page.config?.team) delete page.config.team.members;
      await store.update('resources', { id: about.id }, { data: JSON.stringify(page) });
    }
    for (const slug of ['contact', 'gallery']) {
      const row = pages.find((row) => JSON.parse(row.data).slug === slug);
      if (!row)
        await store.insert('resources', {
          kind: 'pages',
          data: JSON.stringify(pageDefaults[slug]),
        });
      else {
        const page = JSON.parse(row.data);
        // Preserve existing custom copy and any previously saved configuration.
        page.config = { ...structuredClone(pageDefaults[slug].config), ...page.config };
        await store.update('resources', { id: row.id }, { data: JSON.stringify(page) });
      }
    }
    await store.insert('migrations', { version: 20 });
  });
}
