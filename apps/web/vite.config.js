import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

export default defineConfig(async ({ command }) => {
  const env =
    command === 'serve'
      ? parseEnv(readFileSync(new URL('../../.env.development', import.meta.url), 'utf8'))
      : {};
  const apiOrigin = `http://127.0.0.1:${process.env.PORT || env.PORT || 3000}`;

  // The API connects to MongoDB and seeds content before it starts listening.
  if (command === 'serve') {
    console.log(`Waiting for the API at ${apiOrigin}...`);
    const deadline = Date.now() + 120_000;
    let ready = false;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${apiOrigin}/api/health`, {
          signal: AbortSignal.timeout(2000),
        });
        const health = await response.json();
        if (response.ok && health.ok && health.database === 'mongodb') {
          ready = true;
          break;
        }
      } catch {
        // Retry while the API is starting.
      }
      await delay(500);
    }
    if (!ready)
      throw new Error(
        `API did not become ready at ${apiOrigin}. Check the API terminal output and MongoDB connection settings.`,
      );
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': apiOrigin,
        '/uploads': apiOrigin,
      },
    },
  };
});
