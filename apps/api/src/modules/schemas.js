import { z } from 'zod';
import { validatePageContent } from './page-content.js';
const title = z.string().trim().min(2).max(120),
  description = z.string().trim().min(5).max(5000),
  sport = z.enum(['Chess', 'Badminton']);
const media = z
  .string()
  .max(2000)
  .refine(
    (value) =>
      value === '' ||
      (value.startsWith('/') && !value.startsWith('//')) ||
      /^https:\/\//.test(value),
    'Use an HTTPS URL or local /asset path',
  )
  .optional()
  .default('');
const published = z.boolean().default(false),
  integer = z.number().int().min(1).max(10000);
export const schemas = {
  pages: z
    .object({
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .max(70),
      title,
      body: description,
      config: z.record(z.string(), z.unknown()).default({}),
      published,
    })
    .transform(validatePageContent),
  programs: z.object({
    title,
    sport,
    level: title,
    description,
    mode: title,
    image: media,
    published,
  }),
  events: z.object({
    title,
    sport,
    description,
    start: z.iso.datetime({ offset: true }),
    location: z.string().trim().max(120).default(''),
    capacity: integer,
    membersOnly: z.boolean().default(false),
    image: media.refine((value) => value.trim().length > 0, 'Add an image for this event.'),
    imageAlt: z.string().trim().max(250).default(''),
    published,
  }),
  slots: z
    .object({
      title,
      sport,
      start: z.iso.datetime({ offset: true }),
      end: z.iso.datetime({ offset: true }),
      location: title,
      capacity: integer,
      membersOnly: z.boolean().default(false),
      published,
    })
    .refine((x) => new Date(x.end) > new Date(x.start), { message: 'End must be after start' }),
  plans: z.object({
    title,
    description,
    price: z.number().min(0).max(1000000),
    durationDays: integer,
    published,
  }),
  gallery: z.object({
    title,
    description,
    url: z
      .string()
      .max(2000)
      .refine(
        (v) => (v.startsWith('/') && !v.startsWith('//')) || /^https:\/\//.test(v),
        'Use an HTTPS URL or local /asset path',
      ),
    published,
  }),
};
export const signup = z.object({
  name: title,
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const login = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(128),
});
export function parse(schema, value) {
  const r = schema.safeParse(value);
  if (!r.success) {
    const e = new Error(r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    e.status = 400;
    throw e;
  }
  return r.data;
}
export function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
export function id(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(400, 'Invalid ID');
  return n;
}
