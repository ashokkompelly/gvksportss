import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { db, resource, transaction } from '../db/index.js';
import { parse, id, fail } from './schemas.js';

export const registrationDetails = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^\+?[\d\s()-]+$/, 'Enter a valid phone number.')
    .transform((value) => value.replace(/\D/g, ''))
    .refine(
      (value) => value.length >= 10 && value.length <= 15,
      'Enter a phone number with 10 to 15 digits.',
    ),
});

export const registrations = Router();
registrations.post(
  '/',
  rateLimit({ windowMs: 3600000, limit: 30, message: { error: 'Please try again later.' } }),
  (req, res) => {
    const target = id(req.body.id);
    const details = parse(registrationDetails, req.body);
    transaction(() => {
      const event = resource(target, 'events');
      if (!event?.published) fail(404, 'This event is unavailable.');
      if (new Date(event.start) <= new Date()) fail(409, 'Registration has closed.');
      if (
        event.membersOnly &&
        (!req.user ||
          !db
            .prepare(
              "SELECT 1 FROM memberships WHERE user_id=? AND status='active' AND valid_until>?",
            )
            .get(req.user.id, new Date().toISOString()))
      )
        fail(403, 'An active membership is required for this event.');
      if (
        db
          .prepare('SELECT 1 FROM registrations WHERE event_id=? AND (phone=? OR user_id=?)')
          .get(target, details.phone, req.user?.id ?? null)
      )
        fail(409, 'You have already registered for this event.');
      if (
        db.prepare('SELECT count(*) AS n FROM registrations WHERE event_id=?').get(target).n >=
        event.capacity
      )
        fail(409, 'No places remaining.');
      db.prepare('INSERT INTO registrations(user_id,event_id,name,phone) VALUES(?,?,?,?)').run(
        req.user?.id ?? null,
        target,
        details.name,
        details.phone,
      );
    });
    res.status(201).json({ ok: true });
  },
);
