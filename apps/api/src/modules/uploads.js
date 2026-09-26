import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { audit, store } from '../db/index.js';
import { saveMedia, readMedia } from '../db/media.js';
import { fail } from './schemas.js';

export async function uploadImage(req, res) {
  if (!Buffer.isBuffer(req.body) || !req.body.length) fail(400, 'Choose an image to upload.');
  const bytes = req.body;
  const raster =
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
  if (!raster) fail(400, 'Choose a JPG, PNG or WebP image.');
  let result;
  try {
    const image = sharp(req.body, { limitInputPixels: 40_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages || 1) > 1)
      fail(400, 'Choose a still JPG, PNG or WebP image.');
    result = await image
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    if (error.status) throw error;
    fail(
      400,
      'This image could not be processed. Choose a valid JPG, PNG or WebP image under 40 megapixels.',
    );
  }
  const filename = randomUUID() + '.webp';
  await saveMedia(store.database, filename, result.data);
  await audit(req.user, 'image:upload', filename);
  res
    .status(201)
    .json({ url: '/uploads/' + filename, width: result.info.width, height: result.info.height });
}

export async function serveMongoImage(req, res) {
  if (!/^\/[a-zA-Z0-9_.-]+$/.test(req.path)) return res.sendStatus(404);
  const image = await readMedia(store.database, req.path.slice(1));
  if (!image) return res.sendStatus(404);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.type(image.contentType).send(image.bytes);
}
