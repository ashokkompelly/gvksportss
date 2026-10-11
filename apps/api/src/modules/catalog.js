import { catalogCacheHeaders } from './catalog-cache.js';
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
  const { kind } = req.params;
  if (!schemas[kind]) fail(404, 'Not found');
  const items = await resources(kind);
  let result;
  if (['slots', 'events'].includes(kind)) {
    const table = kind === 'slots' ? 'bookings' : 'registrations',
      key = kind === 'slots' ? 'slot_id' : 'event_id';
    const counts =
      store.backend === 'sqlite'
        ? {}
        : await store.countBy(
            table,
            key,
            items.map((item) => item.id),
          );
    result = items.map((item) => ({
      ...item,
      remaining: store.backend === 'sqlite' ? null : item.capacity - (counts[item.id] || 0),
    }));
  } else result = kind === 'pages' ? items.map(publicContent) : items;
  catalogCacheHeaders(req, res, store.backend);
  res.json(result);
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
