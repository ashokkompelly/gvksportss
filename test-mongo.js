import './apps/api/src/config/load-env.js';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is missing. Set it in the GoDaddy app environment settings.');
  process.exitCode = 1;
} else {
  console.log('MONGODB_URI is present. Testing MongoDB connectivity...');
  // Also bound DNS resolution, which can outlast the driver connection timeout.
  const deadline = setTimeout(() => {
    console.error('MongoDB test timed out after 15 seconds. Check DNS and outbound TCP access.');
    process.exit(1);
  }, 15000);
  let client;
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      timeoutMS: 5000,
    });
    await client.connect();
    await client.db(process.env.MONGODB_DATABASE || 'gvk_db').command({ ping: 1 });
    console.log('PASS: MongoDB connection and ping succeeded.');
  } catch (error) {
    // Print error names and codes only; raw errors can contain connection details.
    const codes = new Set();
    const seen = new Set();
    const inspect = (value) => {
      if (!value || typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      if (value.code != null) codes.add(String(value.code));
      inspect(value.cause);
      for (const server of value.reason?.servers?.values() || []) inspect(server.error);
    };
    inspect(error);
    console.error(`FAIL: ${error.name}; codes: ${[...codes].join(', ') || 'none'}`);
    console.error(
      'Check GoDaddy outbound TCP access to Atlas on port 27017, Atlas Network Access IPs, and database credentials.',
    );
    process.exitCode = 1;
  } finally {
    await client?.close();
    clearTimeout(deadline);
  }
}
