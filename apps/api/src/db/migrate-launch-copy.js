// Apply the approved launch copy once; later administrator edits remain untouched.
export async function migrateLaunchCopy(store) {
  await store.transaction(async () => {
    if (await store.one('migrations', { version: 21 })) return;
    const pages = await store.all('resources', { kind: 'pages' });
    const home = pages.find((row) => JSON.parse(row.data).slug === 'home');
    if (home) {
      const page = JSON.parse(home.data);
      page.config ??= {};
      page.config.launch = {
        ...page.config.launch,
        eyebrow: 'The Grand Opening',
        tagline: "Just Play Don't Stop",
        title: 'Creating Events, Inspiring Champions',
        description: 'The stage is set. Join us as we open the doors to GVK Sportss.',
        buttonLabel: 'Launch Now',
        skipLabel: 'Explore GVK Sportss',
      };
      await store.update('resources', { id: home.id }, { data: JSON.stringify(page) });
    }
    await store.insert('migrations', { version: 21 });
  });
}
