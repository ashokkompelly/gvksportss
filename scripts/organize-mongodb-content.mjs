import { MongoClient } from 'mongodb';
import { organizeContent } from '../apps/api/src/db/organize-content.js';

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const result = await organizeContent(
    client,
    process.env.MONGODB_DATABASE || 'gvksportss',
    process.env.MONGODB_RESOURCE_COLLECTION || 'resources',
  );
  if (result.alreadyOrganized) console.log('Content is already organized; no data was changed.');
  else {
    console.table(result.counts);
    console.log(
      `Every content record verified. ${result.legacyCollection} retained as a migration backup.`,
    );
  }
} finally {
  await client.close();
}
