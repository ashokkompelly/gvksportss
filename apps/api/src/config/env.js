import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const config = {
  port: Number(process.env.PORT || 4000),
  origin: process.env.APP_ORIGIN || 'http://localhost:5173',
  production: process.env.NODE_ENV === 'production',
  database: process.env.DATABASE_PATH || path.join(root, 'data/gvk.sqlite'),
};
