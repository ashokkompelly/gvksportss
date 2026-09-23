import { Router } from 'express';
import { db, resource, transaction } from '../db/index.js';
import { authenticated } from './auth.js';
import { id, fail } from './schemas.js';
export const member = Router();
member.use(authenticated);
function active(user) {
  return db
    .prepare("SELECT 1 FROM memberships WHERE user_id=? AND status='active' AND valid_until>?")
    .get(user, new Date().toISOString());
}
member.get('/', (req, res) => {
  const joined = (table, key) =>
    db
      .prepare(
        `SELECT t.*,r.data FROM ${table} t JOIN resources r ON r.id=t.${key} WHERE user_id=? ORDER BY t.id DESC`,
      )
      .all(req.user.id)
      .map((r) => ({ ...r, item: JSON.parse(r.data), data: undefined }));
  db.prepare(
    "UPDATE memberships SET status='cancelled' WHERE user_id=? AND status='active' AND valid_until IS NOT NULL AND valid_until<=?",
  ).run(req.user.id, new Date().toISOString());
  res.json({
    bookings: joined('bookings', 'slot_id'),
    registrations: joined('registrations', 'event_id'),
    memberships: joined('memberships', 'plan_id'),
  });
});
for (const [route, kind, table, key] of [
  ['bookings', 'slots', 'bookings', 'slot_id'],
  ['registrations', 'events', 'registrations', 'event_id'],
]) {
  member.post('/' + route, (req, res) => {
    const target = id(req.body.id);
    transaction(() => {
      const item = resource(target, kind);
      if (!item?.published) fail(404, 'This session or event is unavailable.');
      if (new Date(item.start) <= new Date()) fail(409, 'Registration has closed.');
      if (item.membersOnly && !active(req.user.id)) fail(403, 'An active membership is required.');
      if (
        db.prepare(`SELECT 1 FROM ${table} WHERE user_id=? AND ${key}=?`).get(req.user.id, target)
      )
        fail(409, 'You have already reserved this place.');
      if (
        db.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${key}=?`).get(target).n >=
        item.capacity
      )
        fail(409, 'No places remaining.');
      if (kind === 'slots') {
        const others = db
          .prepare(
            'SELECT r.data FROM bookings b JOIN resources r ON r.id=b.slot_id WHERE b.user_id=?',
          )
          .all(req.user.id);
        if (
          others.some((r) => {
            const o = JSON.parse(r.data);
            return o.start < item.end && o.end > item.start;
          })
        )
          fail(409, 'This time overlaps another booking.');
      }
      db.prepare(`INSERT INTO ${table}(user_id,${key}) VALUES(?,?)`).run(req.user.id, target);
    });
    res.status(201).json({ ok: true });
  });
  member.delete('/' + route + '/:id', (req, res) => {
    const result = db
      .prepare(`DELETE FROM ${table} WHERE id=? AND user_id=?`)
      .run(id(req.params.id), req.user.id);
    if (!result.changes) fail(404, 'Reservation not found.');
    res.json({ ok: true });
  });
}
member.post('/memberships', (req, res) => {
  transaction(() => {
    const plan = resource(id(req.body.id), 'plans');
    if (!plan?.published) fail(404, 'Plan unavailable.');
    db.prepare(
      "UPDATE memberships SET status='cancelled' WHERE user_id=? AND status='active' AND valid_until<=?",
    ).run(req.user.id, new Date().toISOString());
    if (
      db
        .prepare("SELECT 1 FROM memberships WHERE user_id=? AND status IN ('active','pending')")
        .get(req.user.id)
    )
      fail(409, 'You already have an active or pending membership.');
    db.prepare('INSERT INTO memberships(user_id,plan_id) VALUES(?,?)').run(req.user.id, plan.id);
  });
  res.status(201).json({ ok: true });
});
member.delete('/memberships/:id', (req, res) => {
  const r = db
    .prepare(
      "UPDATE memberships SET status='cancelled' WHERE id=? AND user_id=? AND status IN ('active','pending')",
    )
    .run(id(req.params.id), req.user.id);
  if (!r.changes) fail(404, 'Membership not found.');
  res.json({ ok: true });
});
