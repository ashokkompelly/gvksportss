import { z } from 'zod';
import { pageDefaults, mergeContent } from '../../../../shared/siteContent.js';

const safeDestination = (value, contactLink = false) => {
  if (value === '') return true;
  if (/[\\\u0000-\u0020]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'https:' || (contactLink && ['mailto:', 'tel:'].includes(protocol));
  } catch {
    return false;
  }
};
function schemaFor(sample, key = '') {
  if (Array.isArray(sample)) {
    return z
      .array(schemaFor(sample[0] ?? ''))
      .max(100)
      .superRefine((items, ctx) => {
        const ids = items.filter((item) => item && typeof item === 'object').map((item) => item.id);
        if (ids.length !== new Set(ids).size)
          ctx.addIssue({ code: 'custom', message: 'Each item must have a unique ID.' });
      });
  }
  if (sample && typeof sample === 'object')
    return z.object(
      Object.fromEntries(
        Object.entries(sample).map(([name, value]) => [name, schemaFor(value, name)]),
      ),
    );
  if (typeof sample === 'boolean') return z.boolean();
  if (['href', 'image', 'Chess', 'Badminton'].includes(key))
    return z
      .string()
      .max(2000)
      .refine(
        (value) => safeDestination(value, key === 'href'),
        'Use an HTTPS URL or local /path; links also accept mailto: and tel:.',
      );
  if (key === 'id') return z.string().min(1).max(100);
  if (key === 'name') return z.string().trim().min(2).max(120);
  return z.string().max(5000);
}
export const pageConfigSchemas = Object.fromEntries(
  Object.entries(pageDefaults).map(([slug, page]) => [slug, schemaFor(page.config)]),
);
export function validatePageContent(page, ctx) {
  const schema = pageConfigSchemas[page.slug];
  if (!schema) return page;
  const result = schema.safeParse(mergeContent(pageDefaults[page.slug].config, page.config));
  if (!result.success) {
    for (const issue of result.error.issues)
      ctx.addIssue({ ...issue, path: ['config', ...issue.path] });
    return z.NEVER;
  }
  return { ...page, config: result.data };
}
