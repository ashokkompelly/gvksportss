import { Router, raw } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { uploadImage } from './uploads.js';
import { db, resource, resources, audit, transaction } from '../db/index.js';
import { authenticated, admin as requireAdmin, hashPassword } from './auth.js';
import { managedSlugs } from '../../../../shared/siteContent.js';
import { schemas, parse, fail, id } from './schemas.js';
export const admin = Router();
admin.use(authenticated, requireAdmin);
admin.post(
  '/uploads',
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 60,
    message: { error: 'Too many uploads. Please try again shortly.' },
  }),
  raw({ type: 'application/octet-stream', limit: '10mb', inflate: false }),
  uploadImage,
);
const userCreate = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.enum(['member', 'admin']).default('member'),
});
const userUpdate = userCreate.partial().extend({
  password: z.string().min(12).max(128).optional(),
});
admin.get('/overview', (req, res) =>
  res.json({
    users: db.prepare('SELECT id,name,email,role,created_at FROM users ORDER BY id DESC').all(),
    memberships: db
      .prepare(
        'SELECT m.*,u.name,u.email,r.data FROM memberships m JOIN users u ON u.id=m.user_id JOIN resources r ON r.id=m.plan_id ORDER BY m.id DESC',
      )
      .all()
      .map((r) => ({ ...r, plan: JSON.parse(r.data).title, data: undefined })),
    enquiries: db.prepare('SELECT * FROM enquiries ORDER BY id DESC').all(),
    bookings: db
      .prepare(
        'SELECT b.id,u.name,u.email,r.data FROM bookings b JOIN users u ON u.id=b.user_id JOIN resources r ON r.id=b.slot_id',
      )
      .all()
      .map((r) => ({ ...r, item: JSON.parse(r.data), data: undefined })),
    registrations: db
      .prepare(
        'SELECT b.id,u.name,u.email,r.data FROM registrations b JOIN users u ON u.id=b.user_id JOIN resources r ON r.id=b.event_id',
      )
      .all()
      .map((r) => ({ ...r, item: JSON.parse(r.data), data: undefined })),
  }),
);
admin.patch('/memberships/:id', (req, res) => {
  const v = parse(z.object({ status: z.enum(['active', 'cancelled']) }), req.body);
  transaction(() => {
    const m = db.prepare('SELECT * FROM memberships WHERE id=?').get(id(req.params.id));
    if (!m) fail(404, 'Not found');
    if (v.status === 'active' && m.status !== 'pending')
      fail(409, 'Only pending memberships can be activated.');
    const plan = resource(m.plan_id, 'plans');
    const until = new Date(Date.now() + plan.durationDays * 86400000).toISOString();
    db.prepare('UPDATE memberships SET status=?,valid_until=? WHERE id=?').run(
      v.status,
      v.status === 'active' ? until : m.valid_until,
      m.id,
    );
    audit(req.user, 'membership:' + v.status, m.id);
  });
  res.json({ ok: true });
});
for (const [route, table] of [
  ['bookings', 'bookings'],
  ['registrations', 'registrations'],
]) {
  admin.delete('/' + route + '/:id', (req, res) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id(req.params.id));
    if (!result.changes) fail(404, 'Reservation not found.');
    audit(req.user, route + ':delete', id(req.params.id));
    res.json({ ok: true });
  });
}
admin.get('/users', (req, res) =>
  res.json(db.prepare('SELECT id,name,email,role,created_at FROM users ORDER BY id DESC').all()),
);
admin.post('/users', async (req, res) => {
  const v = parse(userCreate, req.body);
  try {
    const result = db
      .prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)')
      .run(v.name, v.email, await hashPassword(v.password), v.role);
    audit(req.user, 'user:create', Number(result.lastInsertRowid));
    res
      .status(201)
      .json({ id: Number(result.lastInsertRowid), name: v.name, email: v.email, role: v.role });
  } catch (e) {
    if (e.code?.startsWith('ERR_SQLITE')) fail(409, 'That email address is already in use.');
    throw e;
  }
});
admin.put('/users/:id', async (req, res) => {
  const target = id(req.params.id);
  const current = db.prepare('SELECT id,name,email,role FROM users WHERE id=?').get(target);
  if (!current) fail(404, 'User not found.');
  const v = parse(userUpdate, req.body);
  if (!Object.keys(v).length) fail(400, 'Provide at least one field to update.');
  const nextRole = v.role || current.role;
  if (target === req.user.id && nextRole !== 'admin')
    fail(400, 'You cannot remove your own admin access.');
  if (current.role === 'admin' && nextRole !== 'admin') {
    const admins = db.prepare("SELECT count(*) AS count FROM users WHERE role='admin'").get().count;
    if (admins <= 1) fail(409, 'Keep at least one administrator account.');
  }
  try {
    const password = v.password ? await hashPassword(v.password) : undefined;
    db.prepare(
      'UPDATE users SET name=COALESCE(?,name),email=COALESCE(?,email),password=COALESCE(?,password),role=COALESCE(?,role) WHERE id=?',
    ).run(v.name ?? null, v.email ?? null, password ?? null, v.role ?? null, target);
    audit(req.user, 'user:update', target);
    res.json(db.prepare('SELECT id,name,email,role,created_at FROM users WHERE id=?').get(target));
  } catch (e) {
    if (e.code?.startsWith('ERR_SQLITE')) fail(409, 'That email address is already in use.');
    throw e;
  }
});
admin.delete('/users/:id', (req, res) => {
  const target = id(req.params.id);
  if (target === req.user.id) fail(400, 'You cannot delete your own account.');
  const user = db.prepare('SELECT id,role FROM users WHERE id=?').get(target);
  if (!user) fail(404, 'User not found.');
  if (user.role === 'admin') {
    const admins = db.prepare("SELECT count(*) AS count FROM users WHERE role='admin'").get().count;
    if (admins <= 1) fail(409, 'Keep at least one administrator account.');
  }
  try {
    db.prepare('DELETE FROM users WHERE id=?').run(target);
    audit(req.user, 'user:delete', target);
  } catch (e) {
    if (e.code?.startsWith('ERR_SQLITE'))
      fail(409, 'This member has linked bookings or registrations.');
    throw e;
  }
  res.json({ ok: true });
});
admin.get('/:kind', (req, res) => {
  if (!schemas[req.params.kind]) fail(404, 'Not found');
  res.json(resources(req.params.kind, true));
});
function save(req, res) {
  const { kind } = req.params;
  if (!schemas[kind]) fail(404, 'Not found');
  const existing = req.params.id ? resource(id(req.params.id), kind) : null;
  if (
    existing &&
    kind === 'pages' &&
    [...managedSlugs, 'footer'].includes(existing.slug) &&
    req.body.slug !== existing.slug
  )
    fail(400, 'This page URL is reserved. Edit its content without changing its slug.');
  const input =
    kind === 'pages' && existing && req.body.config === undefined
      ? { ...req.body, config: existing.config }
      : req.body;
  const data = parse(schemas[kind], input);
  transaction(() => {
    const current = req.params.id ? id(req.params.id) : null;
    if (current && !resource(current, kind)) fail(404, 'Not found');
    if (
      kind === 'pages' &&
      resources(kind, true).some((r) => r.slug === data.slug && r.id !== current)
    )
      fail(409, 'That page slug already exists.');
    if (current && ['slots', 'events'].includes(kind)) {
      const table = kind === 'slots' ? 'bookings' : 'registrations',
        key = kind === 'slots' ? 'slot_id' : 'event_id';
      const n = db.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${key}=?`).get(current).n;
      if (n > data.capacity) fail(409, 'Capacity cannot be lower than existing reservations.');
      const old = resource(current, kind);
      if (n && ['start', 'end', 'sport', 'location', 'membersOnly'].some((k) => old[k] !== data[k]))
        fail(
          409,
          'Reserved sessions cannot change time, sport, venue or access. Create a new session.',
        );
    }
    let saved = current;
    if (current)
      db.prepare('UPDATE resources SET data=? WHERE id=? AND kind=?').run(
        JSON.stringify(data),
        current,
        kind,
      );
    else
      saved = Number(
        db.prepare('INSERT INTO resources(kind,data) VALUES(?,?)').run(kind, JSON.stringify(data))
          .lastInsertRowid,
      );
    audit(req.user, kind + ':save', saved);
    res.status(current ? 200 : 201).json({ id: saved, ...data });
  });
}
admin.post('/:kind', save);
admin.put('/:kind/:id', save);
admin.delete('/:kind/:id', (req, res) => {
  const { kind } = req.params;
  if (!schemas[kind]) fail(404, 'Not found');
  transaction(() => {
    const target = id(req.params.id);
    if (!resource(target, kind)) fail(404, 'Not found');
    try {
      db.prepare('DELETE FROM resources WHERE id=? AND kind=?').run(target, kind);
    } catch (e) {
      fail(409, 'This item has linked records. Unpublish it instead.');
    }
    audit(req.user, kind + ':delete', target);
  });
  res.json({ ok: true });
});
