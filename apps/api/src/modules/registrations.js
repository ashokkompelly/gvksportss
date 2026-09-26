import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { resource, transaction, store } from '../db/index.js';
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
  rateLimit({
    windowMs: 3600000,
    limit: 30,
    message: {
      error: 'Please try again later.',
    },
  }),
  async (req, res) => {
    const target = id(req.body.id);
    const details = parse(registrationDetails, req.body);
    await transaction(async () => {
      const event = await resource(target, 'events');
      if (!event?.published) fail(404, 'This event is unavailable.');
      if (new Date(event.start) <= new Date()) fail(409, 'Registration has closed.');
      if (
        event.membersOnly &&
        (!req.user ||
          !(await store.one('memberships', {
            user_id: req.user.id,
            status: 'active',
            valid_until: {
              $gt: new Date().toISOString(),
            },
          })))
      )
        fail(403, 'An active membership is required for this event.');
      if (
        await store.one('registrations', {
          event_id: target,
          $or: [
            {
              phone: details.phone,
            },
            {
              user_id: {
                $eq: req.user?.id ?? null,
                $ne: null,
              },
            },
          ],
        })
      )
        fail(409, 'You have already registered for this event.');
      if (
        (await store.count('registrations', {
          event_id: target,
        })) >= event.capacity
      )
        fail(409, 'No places remaining.');
      await store.insert('registrations', {
        user_id: req.user?.id ?? null,
        event_id: target,
        name: details.name,
        phone: details.phone,
      });
    });
    res.status(201).json({
      ok: true,
    });
  },
);
