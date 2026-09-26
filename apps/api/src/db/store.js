import { AsyncLocalStorage } from 'node:async_hooks';
import { MongoClient } from 'mongodb';
import { categorizedContent, createContentIndexes } from './content-store.js';

export const tables = [
  'users',
  'sessions',
  'resources',
  'bookings',
  'registrations',
  'memberships',
  'enquiries',
  'audit',
  'migrations',
];
const keys = { sessions: 'token', migrations: 'version' };
const defaults = {
  users: { role: 'member' },
  registrations: { user_id: null, name: null, phone: null },
  memberships: { status: 'pending', valid_until: null },
  enquiries: { organization: null },
};
const timestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const valid = (table) => {
  if (!tables.includes(table)) throw new Error('Unknown table');
  return table;
};

export async function mongoStore(uri, database, { onConnected = () => {} } = {}) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: process.env.SQLITE_FALLBACK === 'false' ? 15000 : 2000,
    connectTimeoutMS: process.env.SQLITE_FALLBACK === 'false' ? 10000 : 2000,
    timeoutMS: process.env.SQLITE_FALLBACK === 'false' ? 15000 : 3000,
  });
  try {
    await client.connect();
    onConnected();
  } catch (error) {
    await client.close();
    console.error(
      'MongoDB connection failed. Check hosting outbound TCP access to Atlas (port 27017), the Atlas IP access list, and MONGODB_URI credentials. A local .env file is not required when hosting supplies environment variables.',
    );
    throw error;
  }
  const db = client.db(database);
  const context = new AsyncLocalStorage();
  const options = () => (context.getStore() ? { session: context.getStore() } : {});
  const resourceCollection = process.env.MONGODB_RESOURCE_COLLECTION || 'resources';
  if (
    !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(resourceCollection) ||
    tables.filter((name) => name !== 'resources').includes(resourceCollection)
  ) {
    await client.close();
    throw new Error('Invalid MONGODB_RESOURCE_COLLECTION');
  }
  const collection = (table) =>
    db.collection(valid(table) === 'resources' ? resourceCollection : table);
  let categorized;
  const content = categorizedContent(db, options);
  const contentIsCategorized = async () => {
    if (!categorized)
      categorized = !!(await db
        .collection('_control')
        .findOne({ _id: 'content_layout', version: 2 }, options()));
    return categorized;
  };
  try {
    categorized = !!(await db
      .collection('_control')
      .findOne({ _id: 'content_layout', version: 2 }));
    if (categorized) await createContentIndexes(db);
    for (const table of tables)
      await collection(table).createIndex({ [keys[table] || 'id']: 1 }, { unique: true });
    await collection('users').createIndex({ email: 1 }, { unique: true });
    await collection('resources').createIndex({ kind: 1, id: 1 });
    await collection('bookings').createIndex({ user_id: 1, slot_id: 1 }, { unique: true });
    await collection('registrations').createIndex(
      { user_id: 1, event_id: 1 },
      { unique: true, partialFilterExpression: { user_id: { $type: 'number' } } },
    );
    await collection('registrations').createIndex(
      { event_id: 1, phone: 1 },
      { unique: true, partialFilterExpression: { phone: { $type: 'string' } } },
    );
    await collection('memberships').createIndex(
      { user_id: 1 },
      { unique: true, partialFilterExpression: { status: { $in: ['pending', 'active'] } } },
    );
    await db
      .collection('_control')
      .updateOne({ _id: 'writes' }, { $setOnInsert: { version: 0 } }, { upsert: true });
  } catch (error) {
    await client.close();
    throw error;
  }
  const store = {
    backend: 'mongodb',
    client,
    database: db,
    async all(table, filter = {}, sort = {}, fields) {
      if (table === 'resources' && (await contentIsCategorized()))
        return content.all(filter, sort, fields);
      const projection = fields ? Object.fromEntries(fields.map((k) => [k, 1])) : {};
      return collection(table)
        .find(filter, { ...options(), projection: { ...projection, _id: 0 } })
        .sort(sort)
        .toArray();
    },
    async one(table, filter = {}, fields) {
      if (table === 'resources' && (await contentIsCategorized()))
        return (await content.all(filter, {}, fields))[0] || null;
      const projection = fields ? Object.fromEntries(fields.map((k) => [k, 1])) : {};
      return collection(table).findOne(filter, {
        ...options(),
        projection: { ...projection, _id: 0 },
      });
    },
    async count(table, filter = {}) {
      if (table === 'resources' && (await contentIsCategorized()))
        return content.all(filter).then((rows) => rows.length);
      return collection(table).countDocuments(filter, options());
    },
    async insert(table, values) {
      if (!context.getStore()) return store.transaction(() => store.insert(table, values));
      const row = { ...defaults[table], ...values };
      const links =
        {
          sessions: [['user_id', 'users']],
          bookings: [
            ['user_id', 'users'],
            ['slot_id', 'resources'],
          ],
          registrations: [
            ['user_id', 'users'],
            ['event_id', 'resources'],
          ],
          memberships: [
            ['user_id', 'users'],
            ['plan_id', 'resources'],
          ],
        }[table] || [];
      for (const [key, target] of links)
        if (row[key] != null && !(await store.one(target, { id: row[key] }))) {
          const error = new Error('Linked record does not exist.');
          error.code = 'LINKED_RECORDS';
          throw error;
        }
      if (!keys[table]) {
        const counter = await db
          .collection('_counters')
          .findOneAndUpdate(
            { _id: table },
            row.id == null ? { $inc: { value: 1 } } : { $max: { value: row.id } },
            { ...options(), upsert: true, returnDocument: 'after' },
          );
        row.id ??= counter.value;
        row.created_at ??= timestamp();
      }
      if (table === 'resources' && categorized) await content.insert(row);
      else await collection(table).insertOne({ ...row, _id: row[keys[table] || 'id'] }, options());
      return { lastInsertRowid: row.id, changes: 1 };
    },
    async update(table, filter, values) {
      if (!context.getStore()) return store.transaction(() => store.update(table, filter, values));
      if (table === 'resources' && categorized) return content.update(filter, values);
      const result = await collection(table).updateMany(filter, { $set: values }, options());
      return { changes: result.matchedCount };
    },
    async remove(table, filter) {
      if (!context.getStore()) return store.transaction(() => store.remove(table, filter));
      // Protect linked records and remove sessions when deleting a user.
      if (table === 'users' || table === 'resources') {
        const rows = await store.all(table, filter);
        for (const row of rows) {
          const links =
            table === 'users'
              ? [
                  ['bookings', 'user_id'],
                  ['registrations', 'user_id'],
                  ['memberships', 'user_id'],
                ]
              : [
                  ['bookings', 'slot_id'],
                  ['registrations', 'event_id'],
                  ['memberships', 'plan_id'],
                ];
          for (const [linked, key] of links)
            if (await store.count(linked, { [key]: row.id })) {
              const error = new Error('This record has linked records.');
              error.code = 'LINKED_RECORDS';
              throw error;
            }
          if (table === 'users')
            await collection('sessions').deleteMany({ user_id: row.id }, options());
        }
      }
      if (table === 'resources' && categorized) return content.remove(filter);
      const result = await collection(table).deleteMany(filter, options());
      return { changes: result.deletedCount };
    },
    async transaction(fn) {
      if (context.getStore()) return fn();
      const session = client.startSession();
      try {
        return await session.withTransaction(
          () =>
            context.run(session, async () => {
              // Serialize writes across app instances, including capacity checks and deletes.
              await db
                .collection('_control')
                .updateOne({ _id: 'writes' }, { $inc: { version: 1 } }, { session });
              categorized = !!(await db
                .collection('_control')
                .findOne({ _id: 'content_layout', version: 2 }, { session }));
              return fn();
            }),
          {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary',
            timeoutMS: 30000,
          },
        );
      } finally {
        await session.endSession();
      }
    },
    close: () => client.close(),
  };
  return store;
}
