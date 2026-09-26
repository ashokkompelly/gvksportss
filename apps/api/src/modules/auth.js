import { Router } from 'express';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { rateLimit } from 'express-rate-limit';
import { store, sessionUser, constraintError } from '../db/index.js';
import { config } from '../config/env.js';
import { parse, signup, login, fail } from './schemas.js';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + (await scrypt(password, salt, 64)).toString('hex');
}
async function verify(password, hash) {
  const [salt, key] = hash.split(':');
  return timingSafeEqual(Buffer.from(key, 'hex'), await scrypt(password, salt, 64));
}
const digest = (t) => createHash('sha256').update(t).digest('hex');
const cookie = (token) =>
  `gvk_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${token ? 604800 : 0}${config.production ? '; Secure' : ''}`;
export async function session(req, res, next) {
  if (store.backend === 'sqlite') return next();
  const token = req.headers.cookie
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('gvk_session='))
    ?.slice(12);
  if (token) {
    req.token = digest(token);
    req.user = await sessionUser(req.token, Date.now());
  }
  next();
}
export function authenticated(req, res, next) {
  if (!req.user)
    return res.status(401).json({
      error: 'Please sign in to continue.',
    });
  next();
}
export function admin(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({
      error: 'Administrator access required.',
    });
  next();
}
async function createSession(user, res) {
  const token = randomBytes(32).toString('hex');
  await store.remove('sessions', {
    expires: {
      $lt: Date.now(),
    },
  });
  await store.insert('sessions', {
    token: digest(token),
    user_id: user.id,
    expires: Date.now() + 604800000,
  });
  res.setHeader('Set-Cookie', cookie(token));
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
export const auth = Router();
auth.get('/me', (req, res) =>
  res.json({
    user: req.user || null,
  }),
);
auth.use(
  rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: 'Too many attempts. Please try later.',
    },
  }),
);
auth.post('/signup', async (req, res) => {
  const v = parse(signup, req.body);
  const hash = await hashPassword(v.password);
  try {
    const r = await store.insert('users', {
      name: v.name,
      email: v.email,
      password: hash,
    });
    res.status(201).json({
      user: await createSession(
        {
          id: Number(r.lastInsertRowid),
          ...v,
          role: 'member',
        },
        res,
      ),
    });
  } catch (e) {
    if (constraintError(e)) fail(409, 'Account could not be created. Try signing in.');
    throw e;
  }
});
auth.post('/login', async (req, res) => {
  const v = parse(login, req.body);
  const user = await store.one('users', {
    email: v.email,
  });
  if (!user || !(await verify(v.password, user.password)))
    fail(401, 'Email or password is incorrect.');
  res.json({
    user: await createSession(user, res),
  });
});
auth.post('/logout', async (req, res) => {
  if (req.token)
    await store.remove('sessions', {
      token: req.token,
    });
  res.setHeader('Set-Cookie', cookie(''));
  res.json({
    ok: true,
  });
});
