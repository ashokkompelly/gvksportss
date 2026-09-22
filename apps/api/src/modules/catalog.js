import { Router } from 'express';
import { resources, db } from '../db/index.js';
import { schemas, fail } from './schemas.js';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { parse } from './schemas.js';
export const catalog = Router();
catalog.get('/:kind', (req, res) => {
  if (!schemas[req.params.kind]) fail(404, 'Not found');
  res.json(
    resources(req.params.kind).map((r) => {
      if (['slots', 'events'].includes(req.params.kind)) {
        const table = req.params.kind === 'slots' ? 'bookings' : 'registrations',
          key = req.params.kind === 'slots' ? 'slot_id' : 'event_id';
        const count = db.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${key}=?`).get(r.id).n;
        return { ...r, remaining: r.capacity - count };
      }
      return r;
    }),
  );
});
export const enquiries = Router();
enquiries.post(
  '/',
  rateLimit({ windowMs: 3600000, limit: 10, message: { error: 'Please try again later.' } }),
  (req, res) => {
    const v = parse(
      z.object({
        name: z.string().trim().min(2).max(120),
        email: z.email().max(254),
        organization: z.string().trim().max(200).default(''),
        message: z.string().trim().min(10).max(3000),
      }),
      req.body,
    );
    db.prepare('INSERT INTO enquiries(name,email,organization,message) VALUES(?,?,?,?)').run(
      v.name,
      v.email,
      v.organization,
      v.message,
    );
    res.status(201).json({ ok: true });
  },
);
