import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas } from '../apps/api/src/modules/schemas.js';
import { galleryImages, MAX_GALLERY_IMAGES } from '../shared/gallery.js';

const legacy = {
  title: 'Sports day',
  description: 'Photos from our sports day.',
  url: '/uploads/cover.jpg',
  published: true,
};

test('legacy gallery entries remain readable and normalize on save', () => {
  assert.deepEqual(galleryImages(legacy), [legacy.url]);
  assert.deepEqual(schemas.gallery.parse(legacy).images, [legacy.url]);
  assert.deepEqual(galleryImages({}), []);
});

test('albums preserve photo order and synchronize the legacy cover after reordering', () => {
  const images = ['/uploads/second.jpg', '/uploads/cover.jpg'];
  const saved = schemas.gallery.parse({ ...legacy, images });
  assert.deepEqual(saved.images, images);
  assert.equal(saved.url, images[0]);
  assert.deepEqual(galleryImages(saved), images);
});

test('gallery rejects empty albums, unsafe photo URLs and oversized albums', () => {
  for (const images of [
    [],
    [''],
    ['javascript:alert(1)'],
    ['//example.com/photo.jpg'],
    Array(MAX_GALLERY_IMAGES + 1).fill('/photo.jpg'),
  ]) {
    assert.equal(schemas.gallery.safeParse({ ...legacy, images }).success, false);
  }
  assert.equal(
    schemas.gallery.safeParse({ ...legacy, images: ['https://example.com/photo.jpg'] }).success,
    true,
  );
});
