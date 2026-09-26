import { Router } from 'express';
import { resources, store } from '../db/index.js';
import { schemas, fail } from './schemas.js';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { parse } from './schemas.js';
function publicContent(value) {
  if (Array.isArray(value))
    return value.filter((item) => item?.published !== false).map(publicContent);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, publicContent(item)]),
    );
  return value;
}
export const catalog = Router();
catalog.get('/:kind', async (req, res) => {
  if (!schemas[req.params.kind]) fail(404, 'Not found');
  res.json(
    await Promise.all(
      (await resources(req.params.kind)).map(async (r) => {
        if (['slots', 'events'].includes(req.params.kind)) {
          const table = req.params.kind === 'slots' ? 'bookings' : 'registrations',
            key = req.params.kind === 'slots' ? 'slot_id' : 'event_id';
          const count = await store.count(table, {
            [key]: r.id,
          });
          return {
            ...r,
            remaining: store.backend === 'sqlite' ? null : r.capacity - count,
          };
        }
        return req.params.kind === 'pages' ? publicContent(r) : r;
      }),
    ),
  );
});
export const enquiries = Router();
enquiries.post(
  '/',
  rateLimit({
    windowMs: 3600000,
    limit: 10,
    message: {
      error: 'Please try again later.',
    },
  }),
  async (req, res) => {
    const v = parse(
      z.object({
        name: z.string().trim().min(2).max(120),
        email: z.email().max(254),
        organization: z.string().trim().max(200).default(''),
        message: z.string().trim().min(10).max(3000),
      }),
      req.body,
    );
    await store.insert('enquiries', {
      name: v.name,
      email: v.email,
      organization: v.organization,
      message: v.message,
    });
    res.status(201).json({
      ok: true,
    });
  },
);
