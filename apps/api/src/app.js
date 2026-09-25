import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { config, root } from './config/env.js';
import './db/seed.js';
import { session, auth } from './modules/auth.js';
import { catalog, enquiries } from './modules/catalog.js';
import { member } from './modules/member.js';
import { admin } from './modules/admin.js';
import { registrations } from './modules/registrations.js';
export const app = express();
app.disable('x-powered-by');
app.use(
  helmet({
    frameguard: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  let isAllowed = !origin || origin === config.origin;
  if (!isAllowed && origin && host) {
    try {
      isAllowed = new URL(origin).host === host;
    } catch {}
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isAllowed)
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(session);
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/catalog', catalog);
app.use('/api/member', member);
app.use('/api/admin', admin);
app.use('/api/enquiries', enquiries);
app.use('/api/registrations', registrations);
app.use(
  '/uploads',
  express.static(config.uploads, {
    dotfiles: 'deny',
    index: false,
    maxAge: '1y',
    immutable: true,
    fallthrough: false,
  }),
);
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));
if (config.production) {
  app.use(express.static(path.join(root, 'apps/web/dist')));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(root, 'apps/web/dist/index.html')));
}
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({
    error:
      err.status === 413 && req.path === '/api/admin/uploads'
        ? 'Image must be 10 MB or smaller.'
        : err.status
          ? req.path.startsWith('/uploads/')
            ? 'Image not found.'
            : err.message
          : 'Something went wrong. Please try again.',
  });
});
