// Indexes/migrations are an explicit maintenance operation on Vercel, not request work.
export const automaticDatabaseSetup =
  process.env.MONGODB_AUTO_SETUP === 'true' ||
  (process.env.MONGODB_AUTO_SETUP !== 'false' && process.env.VERCEL !== '1');
