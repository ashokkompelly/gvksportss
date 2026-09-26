export const MAX_GALLERY_IMAGES = 30;

export function galleryImages(item = {}) {
  return item.images?.length ? item.images : item.url ? [item.url] : [];
}
