import { store } from '../db/index.js';
import { hashPassword } from '../modules/auth.js';
import { signup, parse } from '../modules/schemas.js';
const v = parse(signup, {
  name: process.env.ADMIN_NAME || 'GVK Administrator',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
});
if (
  await store.one('users', {
    email: v.email,
  })
)
  throw new Error('Account already exists; no account was modified.');
await store.insert('users', {
  name: v.name,
  email: v.email,
  password: await hashPassword(v.password),
  role: 'admin',
});
console.log('Administrator created. Remove ADMIN_PASSWORD from your environment.');
await store.close();
