import { isDeepStrictEqual } from 'node:util';
import {
  contentCollections,
  contentDocument,
  contentRow,
  createContentIndexes,
} from './content-store.js';

export async function organizeContent(client, database, sourceName) {
  if (Object.values(contentCollections).includes(sourceName))
    throw new Error('Source conflicts with destination.');
  const db = client.db(database);
  const marker = { _id: 'content_layout' };
  if ((await db.collection('_control').findOne(marker))?.version === 2)
    return { alreadyOrganized: true };
  if (!(await db.listCollections({ name: sourceName }).hasNext()))
    throw new Error('Source collection does not exist.');
  for (const name of Object.values(contentCollections)) {
    if (await db.collection(name).countDocuments())
      throw new Error(`${name} is not empty; refusing to overwrite content.`);
  }
  await createContentIndexes(db);
  const session = client.startSession();
  try {
    return await session.withTransaction(
      async () => {
        await db
          .collection('_control')
          .updateOne({ _id: 'writes' }, { $inc: { version: 1 } }, { session, upsert: true });
        if ((await db.collection('_control').findOne(marker, { session }))?.version === 2)
          return { alreadyOrganized: true };
        const rows = await db.collection(sourceName).find({}, { session }).toArray();
        const counts = Object.fromEntries(
          Object.values(contentCollections).map((name) => [name, 0]),
        );
        for (const name of Object.values(contentCollections)) {
          if (await db.collection(name).countDocuments({}, { session }))
            throw new Error('Destination changed during migration.');
        }
        for (const row of rows) {
          const document = contentDocument(row);
          const name = contentCollections[row.kind];
          await db.collection(name).insertOne(document, { session });
          const saved = await db.collection(name).findOne({ _id: row.id }, { session });
          const restored = contentRow(saved);
          if (
            !isDeepStrictEqual(
              {
                id: row.id,
                kind: row.kind,
                created_at: row.created_at,
                content: JSON.parse(row.data),
              },
              {
                id: restored.id,
                kind: restored.kind,
                created_at: restored.created_at,
                content: JSON.parse(restored.data),
              },
            )
          )
            throw new Error(`Content verification failed for ID ${row.id}`);
          counts[name]++;
        }
        await db
          .collection('_counters')
          .updateOne(
            { _id: 'resources' },
            { $max: { value: Math.max(0, ...rows.map((row) => row.id)) } },
            { upsert: true, session },
          );
        await db
          .collection('_control')
          .updateOne(
            marker,
            {
              $set: {
                version: 2,
                legacyCollection: sourceName,
                migrated_at: new Date().toISOString(),
                counts,
              },
            },
            { upsert: true, session },
          );
        return { counts, legacyCollection: sourceName };
      },
      { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, timeoutMS: 60000 },
    );
  } finally {
    await session.endSession();
  }
}
