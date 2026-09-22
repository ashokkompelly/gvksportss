import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { config, root } from './config/env.js';
import './db/seed.js';
import { session, auth } from './modules/auth.js';
import { catalog, enquiries } from './modules/catalog.js';
import { member } from './modules/member.js';
import { admin } from './modules/admin.js';
export const app = express();
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: ["'self'"],
        upgradeInsecureRequests: config.production ? [] : null,
      },
    },
  }),
);
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin !== config.origin)
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
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));
app.use(express.static(path.join(root, 'apps/web/dist')));
app.get('/{*path}', (req, res) => res.sendFile(path.join(root, 'apps/web/dist/index.html')));
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.status ? err.message : 'Something went wrong. Please try again.' });
});
