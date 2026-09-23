import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { app } from './apps/api/src/app.js';
import { config } from './apps/api/src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = config.port;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(__dirname, 'apps/web'),
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'apps/web/dist');
    app.use(express.static(distPath));
    app.get('/{*path}', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GVK Sportss listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
