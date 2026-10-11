const publicPaths = new Set([
  '/catalog/pages',
  '/catalog/programs',
  '/catalog/plans',
  '/catalog/gallery',
  '/catalog/team',
]);
export function createCatalogCache({ ttl = 30000, now = Date.now } = {}) {
  const entries = new Map();
  let revision = 0;
  let freshToken = '';
  function invalidate(path) {
    revision++;
    freshToken = String(now()) + '-' + revision;
    if (path) entries.delete(path);
    else entries.clear();
  }
  function peek(path) {
    const e = entries.get(path);
    return e && e.expires > now() ? e.value : null;
  }
  function read(path, load) {
    if (!publicPaths.has(path)) return load(path);
    const cached = entries.get(path);
    if (cached?.promise) return cached.promise;
    if (cached && cached.expires > now()) return Promise.resolve(cached.value);
    const entry = {};
    entries.set(path, entry);
    entry.promise = Promise.resolve()
      .then(() => load(path + (freshToken ? '?fresh=' + encodeURIComponent(freshToken) : '')))
      .then((value) => {
        if (entries.get(path) === entry) {
          entry.value = value;
          entry.expires = now() + ttl;
          delete entry.promise;
        }
        return value;
      })
      .catch((error) => {
        if (entries.get(path) === entry) entries.delete(path);
        throw error;
      });
    return entry.promise;
  }
  return { read, peek, invalidate };
}
export const catalogCache = createCatalogCache();
