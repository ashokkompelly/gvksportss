process.env.SQLITE_FALLBACK = 'false';
if (!process.env.MONGODB_URI)
  throw new Error(
    'Tests require MONGODB_URI pointing to a MongoDB replica set (or Atlas). Fixtures use isolated gvk_test_* databases.',
  );
