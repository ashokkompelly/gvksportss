import { Router } from 'express';
import { z } from 'zod';
import { db, resource, resources, audit, transaction } from '../db/index.js';
import { authenticated, admin as requireAdmin } from './auth.js';
import { schemas, parse, fail, id } from './schemas.js';
export const admin = Router();
admin.use(authenticated, requireAdmin);
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
admin.get('/:kind', (req, res) => {
  if (!schemas[req.params.kind]) fail(404, 'Not found');
  res.json(resources(req.params.kind, true));
});
function save(req, res) {
  const { kind } = req.params;
  if (!schemas[kind]) fail(404, 'Not found');
  const data = parse(schemas[kind], req.body);
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
