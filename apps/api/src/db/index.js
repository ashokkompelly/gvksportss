import { mongoStore } from './store.js';
if (!process.env.MONGODB_URI)
  throw new Error('MONGODB_URI is required. Configure it in the active environment file.');
export const store = await mongoStore(
  process.env.MONGODB_URI,
  process.env.MONGODB_DATABASE || 'gvk_db',
);
export const transaction = (fn) => store.transaction(fn);
export const closeDatabase = () => store.close();
export const constraintError = (e) => e.code === 11000 || e.code === 'LINKED_RECORDS';
export const likePattern = (value) =>
  value.replace(/^%|%$/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export async function resource(id, kind) {
  const row = await store.one('resources', { id, kind });
  return row ? { id: row.id, ...JSON.parse(row.data) } : null;
}
export async function resources(kind, all = false) {
  const items = (await store.all('resources', { kind }, { id: 1 }))
    .map((r) => ({ id: r.id, ...JSON.parse(r.data) }))
    .filter((r) => all || r.published);
  return kind === 'team' ? items.sort((a, b) => a.order - b.order || a.id - b.id) : items;
}
export async function audit(user, action, id) {
  await store.insert('audit', { user_id: user.id, action, entity_id: id });
}
export async function sessionUser(token, expires) {
  const session = await store.one('sessions', { token, expires: { $gt: expires } });
  return session
    ? store.one('users', { id: session.user_id }, ['id', 'name', 'email', 'role'])
    : null;
}
export async function joined(table, key, userId, includeUser = false) {
  const rows = await store.all(table, userId === undefined ? {} : { user_id: userId }, { id: -1 });
  const result = [];
  for (const row of rows) {
    const item = await store.one('resources', { id: row[key] });
    if (!item) continue;
    if (includeUser) {
      const user =
        row.user_id == null
          ? null
          : await store.one('users', { id: row.user_id }, ['name', 'email']);
      if (!user && table !== 'registrations') continue;
      result.push({
        ...row,
        name: row.name ?? user?.name ?? null,
        email: user?.email ?? null,
        data: item.data,
      });
    } else result.push({ ...row, data: item.data });
  }
  return result;
}
