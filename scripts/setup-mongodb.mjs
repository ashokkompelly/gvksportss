import '../apps/api/src/config/load-env.js';
import { mongoStore } from '../apps/api/src/db/store.js';
import { seedContent } from '../apps/api/src/db/seed-content.js';
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before running db:setup.');
const store = await mongoStore(process.env.MONGODB_URI, process.env.MONGODB_DATABASE || 'gvk_db', {
  ensureSchema: true,
});
try {
  await seedContent(store);
  console.log('MongoDB indexes and versioned migrations are ready.');
} finally {
  await store.close();
}
