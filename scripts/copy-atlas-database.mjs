import { MongoClient } from 'mongodb';
import { isDeepStrictEqual } from 'node:util';

const [sourceName, targetName, contentName = 'resources'] = process.argv.slice(2);
if (!sourceName || !targetName || sourceName === targetName)
  throw new Error('Provide different source and target database names.');
if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(contentName)) throw new Error('Invalid collection name.');
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const source = client.db(sourceName);
  const target = client.db(targetName);
  const names = (await source.listCollections({}, { nameOnly: true }).toArray()).map(
    (row) => row.name,
  );
  const mapped = (name) => (name === 'resources' ? contentName : name);
  if (new Set(names.map(mapped)).size !== names.length)
    throw new Error('Collection name collision.');
  // Prepare collections and matching indexes before the data transaction.
  const existing = new Set(
    (await target.listCollections({}, { nameOnly: true }).toArray()).map((row) => row.name),
  );
  for (const name of names) {
    const destination = mapped(name);
    if (await target.collection(destination).countDocuments())
      throw new Error(`Target ${destination} is not empty; nothing overwritten.`);
    if (!existing.has(destination)) await target.createCollection(destination);
    for (const index of await source.collection(name).listIndexes().toArray()) {
      if (index.name === '_id_') continue;
      const { key, v, ns, ...options } = index;
      await target.collection(destination).createIndex(key, options);
    }
  }
  const session = client.startSession();
  try {
    await session.withTransaction(
      async () => {
        // Coordinate the snapshot with application writes in the source database.
        await source
          .collection('_control')
          .updateOne({ _id: 'writes' }, { $inc: { version: 1 } }, { session });
        for (const name of names) {
          const destination = target.collection(mapped(name));
          if (await destination.countDocuments({}, { session }))
            throw new Error('Destination changed during copy.');
          const rows = await source.collection(name).find({}, { session }).toArray();
          if (rows.length) await destination.insertMany(rows, { session });
          const copied = await destination.find({}, { session }).toArray();
          const ordered = (items) =>
            items.sort((a, b) => String(a._id).localeCompare(String(b._id)));
          if (!isDeepStrictEqual(ordered(rows), ordered(copied)))
            throw new Error(`Verification failed: ${name}`);
        }
      },
      { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, timeoutMS: 60000 },
    );
  } finally {
    await session.endSession();
  }
  for (const name of names)
    console.log(`${mapped(name)}: ${await target.collection(mapped(name)).countDocuments()}`);
  console.log('Copied and verified all documents, indexes, counters, and uploaded image chunks.');
} finally {
  await client.close();
}
