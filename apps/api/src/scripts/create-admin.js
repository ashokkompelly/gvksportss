import { db } from '../db/index.js';
import { hashPassword } from '../modules/auth.js';
import { signup, parse } from '../modules/schemas.js';
const v = parse(signup, {
  name: process.env.ADMIN_NAME || 'GVK Administrator',
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
});
if (db.prepare('SELECT 1 FROM users WHERE email=?').get(v.email))
  throw new Error('Account already exists; no account was modified.');
db.prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')").run(
  v.name,
  v.email,
  await hashPassword(v.password),
);
console.log('Administrator created. Remove ADMIN_PASSWORD from your environment.');
