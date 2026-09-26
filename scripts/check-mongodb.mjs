import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env.');
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 10000,
});
try {
  await client.connect();
  const database = client.db(process.env.MONGODB_DATABASE || 'gvksportss');
  await database.command({ ping: 1 });
  console.log(`Connected to Atlas database: ${database.databaseName}`);
  for (const { name } of await database.listCollections({}, { nameOnly: true }).toArray()) {
    console.log(`${name}: ${await database.collection(name).countDocuments()}`);
  }
} catch (error) {
  console.error(`Atlas connection failed (${error.name}, ${error.code || 'no code'}).`);
  console.error('Check Atlas Network Access, database credentials, and DNS/network connectivity.');
  process.exitCode = 1;
} finally {
  await client.close();
}
