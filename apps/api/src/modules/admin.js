import { Router, raw } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { uploadImage } from './uploads.js';
import {
  resource,
  resources,
  audit,
  transaction,
  store,
  joined as joinedRecords,
  constraintError,
} from '../db/index.js';
import { authenticated, admin as requireAdmin, hashPassword } from './auth.js';
import { managedSlugs } from '../../../../shared/siteContent.js';
import { schemas, parse, fail, id } from './schemas.js';
import { registrationDetails } from './registrations.js';
export const admin = Router();
admin.use(authenticated, requireAdmin);
admin.post(
  '/uploads',
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 60,
    message: {
      error: 'Too many uploads. Please try again shortly.',
    },
  }),
  raw({
    type: 'application/octet-stream',
    limit: '10mb',
    inflate: false,
  }),
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
admin.get('/overview', async (req, res) =>
  res.json({
    users: await store.all(
      'users',
      {},
      {
        id: -1,
      },
      ['id', 'name', 'email', 'role', 'created_at'],
    ),
    memberships: (await joinedRecords('memberships', 'plan_id', undefined, true)).map((r) => ({
      ...r,
      plan: JSON.parse(r.data).title,
      data: undefined,
    })),
    enquiries: await store.all(
      'enquiries',
      {},
      {
        id: -1,
      },
    ),
    bookings: (await joinedRecords('bookings', 'slot_id', undefined, true)).map((r) => ({
      ...r,
      item: JSON.parse(r.data),
      data: undefined,
    })),
    registrations: (await joinedRecords('registrations', 'event_id', undefined, true)).map((r) => ({
      ...r,
      item: JSON.parse(r.data),
      data: undefined,
    })),
  }),
);
admin.patch('/registrations/:id', async (req, res) => {
  const target = id(req.params.id);
  const details = parse(registrationDetails, req.body);
  await transaction(async () => {
    const current = await store.one('registrations', {
      id: target,
    });
    if (!current) fail(404, 'Registration not found.');
    if (
      await store.one('registrations', {
        event_id: current.event_id,
        phone: details.phone,
        id: {
          $ne: target,
        },
      })
    )
      fail(409, 'This phone number is already registered for this event.');
    await store.update(
      'registrations',
      {
        id: target,
      },
      {
        name: details.name,
        phone: details.phone,
      },
    );
    await audit(req.user, 'registration:update', target);
  });
  res.json({
    ok: true,
  });
});
admin.patch('/memberships/:id', async (req, res) => {
  const v = parse(
    z.object({
      status: z.enum(['active', 'cancelled']),
    }),
    req.body,
  );
  await transaction(async () => {
    const m = await store.one('memberships', {
      id: id(req.params.id),
    });
    if (!m) fail(404, 'Not found');
    if (v.status === 'active' && m.status !== 'pending')
      fail(409, 'Only pending memberships can be activated.');
    const plan = await resource(m.plan_id, 'plans');
    const until = new Date(Date.now() + plan.durationDays * 86400000).toISOString();
    await store.update(
      'memberships',
      {
        id: m.id,
      },
      {
        status: v.status,
        valid_until: v.status === 'active' ? until : m.valid_until,
      },
    );
    await audit(req.user, 'membership:' + v.status, m.id);
  });
  res.json({
    ok: true,
  });
});
for (const [route, table] of [
  ['bookings', 'bookings'],
  ['registrations', 'registrations'],
]) {
  admin.delete('/' + route + '/:id', async (req, res) => {
    const result = await store.remove(table, {
      id: id(req.params.id),
    });
    if (!result.changes) fail(404, 'Reservation not found.');
    await audit(req.user, route + ':delete', id(req.params.id));
    res.json({
      ok: true,
    });
  });
}
admin.get('/users', async (req, res) =>
  res.json(
    await store.all(
      'users',
      {},
      {
        id: -1,
      },
      ['id', 'name', 'email', 'role', 'created_at'],
    ),
  ),
);
admin.post('/users', async (req, res) => {
  const v = parse(userCreate, req.body);
  try {
    const result = await store.insert('users', {
      name: v.name,
      email: v.email,
      password: await hashPassword(v.password),
      role: v.role,
    });
    await audit(req.user, 'user:create', Number(result.lastInsertRowid));
    res.status(201).json({
      id: Number(result.lastInsertRowid),
      name: v.name,
      email: v.email,
      role: v.role,
    });
  } catch (e) {
    if (constraintError(e)) fail(409, 'That email address is already in use.');
    throw e;
  }
});
admin.put('/users/:id', async (req, res) => {
  const target = id(req.params.id);
  const v = parse(userUpdate, req.body);
  if (!Object.keys(v).length) fail(400, 'Provide at least one field to update.');
  const password = v.password ? await hashPassword(v.password) : undefined;
  try {
    const user = await transaction(async () => {
      const current = await store.one('users', { id: target });
      if (!current) fail(404, 'User not found.');
      const nextRole = v.role || current.role;
      if (target === req.user.id && nextRole !== 'admin')
        fail(400, 'You cannot remove your own admin access.');
      if (
        current.role === 'admin' &&
        nextRole !== 'admin' &&
        (await store.count('users', { role: 'admin' })) <= 1
      )
        fail(409, 'Keep at least one administrator account.');
      const changes = Object.fromEntries(
        Object.entries({ ...v, password }).filter(([, value]) => value !== undefined),
      );
      await store.update('users', { id: target }, changes);
      await audit(req.user, 'user:update', target);
      return store.one('users', { id: target }, ['id', 'name', 'email', 'role', 'created_at']);
    });
    res.json(user);
  } catch (e) {
    if (constraintError(e)) fail(409, 'That email address is already in use.');
    throw e;
  }
});
admin.delete('/users/:id', async (req, res) => {
  const target = id(req.params.id);
  if (target === req.user.id) fail(400, 'You cannot delete your own account.');
  try {
    await transaction(async () => {
      const user = await store.one('users', { id: target });
      if (!user) fail(404, 'User not found.');
      if (user.role === 'admin' && (await store.count('users', { role: 'admin' })) <= 1)
        fail(409, 'Keep at least one administrator account.');
      await store.remove('users', { id: target });
      await audit(req.user, 'user:delete', target);
    });
  } catch (e) {
    if (constraintError(e)) fail(409, 'This member has linked bookings or registrations.');
    throw e;
  }
  res.json({ ok: true });
});
admin.put('/team/order', async (req, res) => {
  const ids = parse(z.array(z.number().int().positive()).max(1000), req.body.ids);
  await transaction(async () => {
    const members = await resources('team', true);
    if (
      ids.length !== members.length ||
      new Set(ids).size !== ids.length ||
      members.some((member) => !ids.includes(member.id))
    )
      fail(409, 'Team members changed. Refresh and try again.');
    for (const [order, memberId] of ids.entries()) {
      const { id: ignored, ...member } = members.find((member) => member.id === memberId);
      await store.update(
        'resources',
        { id: memberId, kind: 'team' },
        { data: JSON.stringify({ ...member, order }) },
      );
    }
    await audit(req.user, 'team:reorder', null);
  });
  res.json({ ok: true });
});
admin.get('/:kind', async (req, res) => {
  if (!schemas[req.params.kind]) fail(404, 'Not found');
  res.json(await resources(req.params.kind, true));
});
async function save(req, res) {
  const { kind } = req.params;
  if (!schemas[kind]) fail(404, 'Not found');
  const existing = req.params.id ? await resource(id(req.params.id), kind) : null;
  if (
    existing &&
    kind === 'pages' &&
    [...managedSlugs, 'footer'].includes(existing.slug) &&
    req.body.slug !== existing.slug
  )
    fail(400, 'This page URL is reserved. Edit its content without changing its slug.');
  const input =
    kind === 'pages' && existing && req.body.config === undefined
      ? {
          ...req.body,
          config: existing.config,
        }
      : req.body;
  const data = parse(schemas[kind], input);
  const current = req.params.id ? id(req.params.id) : null;
  const saved = await transaction(async () => {
    if (current && !(await resource(current, kind))) fail(404, 'Not found');
    if (
      kind === 'pages' &&
      (await resources(kind, true)).some((r) => r.slug === data.slug && r.id !== current)
    )
      fail(409, 'That page slug already exists.');
    if (current && ['slots', 'events'].includes(kind)) {
      const table = kind === 'slots' ? 'bookings' : 'registrations',
        key = kind === 'slots' ? 'slot_id' : 'event_id';
      const n = await store.count(table, {
        [key]: current,
      });
      if (n > data.capacity) fail(409, 'Capacity cannot be lower than existing reservations.');
      const old = await resource(current, kind);
      if (n && ['start', 'end', 'sport', 'location', 'membersOnly'].some((k) => old[k] !== data[k]))
        fail(
          409,
          'Reserved sessions cannot change time, sport, venue or access. Create a new session.',
        );
    }
    let saved = current;
    if (current)
      await store.update(
        'resources',
        {
          id: current,
          kind: kind,
        },
        {
          data: JSON.stringify(data),
        },
      );
    else
      saved = Number(
        (
          await store.insert('resources', {
            kind: kind,
            data: JSON.stringify(data),
          })
        ).lastInsertRowid,
      );
    await audit(req.user, kind + ':save', saved);
    return saved;
  });
  res.status(current ? 200 : 201).json({ id: saved, ...data });
}
admin.post('/:kind', save);
admin.put('/:kind/:id', save);
admin.delete('/:kind/:id', async (req, res) => {
  const { kind } = req.params;
  if (!schemas[kind]) fail(404, 'Not found');
  await transaction(async () => {
    const target = id(req.params.id);
    if (!(await resource(target, kind))) fail(404, 'Not found');
    try {
      await store.remove('resources', {
        id: target,
        kind: kind,
      });
    } catch (e) {
      if (constraintError(e)) fail(409, 'This item has linked records. Unpublish it instead.');
      throw e;
    }
    await audit(req.user, kind + ':delete', target);
  });
  res.json({
    ok: true,
  });
});
