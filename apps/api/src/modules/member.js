import { Router } from 'express';
import { resource, transaction, store, joined as joinedRecords } from '../db/index.js';
import { authenticated } from './auth.js';
import { id, fail } from './schemas.js';
export const member = Router();
member.use(authenticated);
async function active(user) {
  return await store.one('memberships', {
    user_id: user,
    status: 'active',
    valid_until: {
      $gt: new Date().toISOString(),
    },
  });
}
member.get('/', async (req, res) => {
  const joined = async (table, key) =>
    (await joinedRecords(table, key, req.user.id)).map((r) => ({
      ...r,
      item: JSON.parse(r.data),
      data: undefined,
    }));
  await store.update(
    'memberships',
    {
      $and: [
        {
          user_id: req.user.id,
        },
        {
          status: 'active',
        },
        {
          valid_until: {
            $ne: null,
          },
        },
        {
          valid_until: {
            $lte: new Date().toISOString(),
          },
        },
      ],
    },
    {
      status: 'cancelled',
    },
  );
  res.json({
    bookings: await joined('bookings', 'slot_id'),
    registrations: await joined('registrations', 'event_id'),
    memberships: await joined('memberships', 'plan_id'),
  });
});
for (const [route, kind, table, key] of [
  ['bookings', 'slots', 'bookings', 'slot_id'],
  ['registrations', 'events', 'registrations', 'event_id'],
]) {
  member.post('/' + route, async (req, res) => {
    const target = id(req.body.id);
    await transaction(async () => {
      const item = await resource(target, kind);
      if (!item?.published) fail(404, 'This session or event is unavailable.');
      if (new Date(item.start) <= new Date()) fail(409, 'Registration has closed.');
      if (item.membersOnly && !(await active(req.user.id)))
        fail(403, 'An active membership is required.');
      if (
        await store.one(table, {
          user_id: req.user.id,
          [key]: target,
        })
      )
        fail(409, 'You have already reserved this place.');
      if (
        (await store.count(table, {
          [key]: target,
        })) >= item.capacity
      )
        fail(409, 'No places remaining.');
      if (kind === 'slots') {
        const others = await joinedRecords('bookings', 'slot_id', req.user.id);
        if (
          others.some((r) => {
            const o = JSON.parse(r.data);
            return o.start < item.end && o.end > item.start;
          })
        )
          fail(409, 'This time overlaps another booking.');
      }
      await store.insert(table, {
        user_id: req.user.id,
        [key]: target,
      });
    });
    res.status(201).json({
      ok: true,
    });
  });
  member.delete('/' + route + '/:id', async (req, res) => {
    const result = await store.remove(table, {
      id: id(req.params.id),
      user_id: req.user.id,
    });
    if (!result.changes) fail(404, 'Reservation not found.');
    res.json({
      ok: true,
    });
  });
}
member.post('/memberships', async (req, res) => {
  await transaction(async () => {
    const plan = await resource(id(req.body.id), 'plans');
    if (!plan?.published) fail(404, 'Plan unavailable.');
    await store.update(
      'memberships',
      {
        user_id: req.user.id,
        status: 'active',
        valid_until: {
          $lte: new Date().toISOString(),
        },
      },
      {
        status: 'cancelled',
      },
    );
    if (
      await store.one('memberships', {
        user_id: req.user.id,
        status: {
          $in: ['active', 'pending'],
        },
      })
    )
      fail(409, 'You already have an active or pending membership.');
    await store.insert('memberships', {
      user_id: req.user.id,
      plan_id: plan.id,
    });
  });
  res.status(201).json({
    ok: true,
  });
});
member.delete('/memberships/:id', async (req, res) => {
  const r = await store.update(
    'memberships',
    {
      id: id(req.params.id),
      user_id: req.user.id,
      status: {
        $in: ['active', 'pending'],
      },
    },
    {
      status: 'cancelled',
    },
  );
  if (!r.changes) fail(404, 'Membership not found.');
  res.json({
    ok: true,
  });
});
