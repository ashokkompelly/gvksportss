import { GridFSBucket } from 'mongodb';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';

export async function saveMedia(database, filename, bytes, contentType = 'image/webp') {
  const hash = createHash('sha256').update(bytes).digest('hex');
  const existing = await database.collection('uploads.files').findOne({ _id: filename });
  if (existing) {
    if (existing.metadata?.sha256 !== hash) throw new Error(`Uploaded image conflict: ${filename}`);
    return;
  }
  const bucket = new GridFSBucket(database, { bucketName: 'uploads' });
  await pipeline(
    Readable.from([bytes]),
    bucket.openUploadStreamWithId(filename, filename, {
      metadata: { contentType, sha256: hash },
    }),
  );
}

export async function readMedia(database, filename) {
  const file = await database.collection('uploads.files').findOne({ _id: filename });
  if (!file) return null;
  const bucket = new GridFSBucket(database, { bucketName: 'uploads' });
  const chunks = [];
  for await (const chunk of bucket.openDownloadStream(filename)) chunks.push(chunk);
  return {
    bytes: Buffer.concat(chunks),
    contentType: file.metadata?.contentType || 'application/octet-stream',
  };
}
