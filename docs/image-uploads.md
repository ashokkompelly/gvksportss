# Admin image uploads

Every image field in the admin portal uses **Upload image** / **Replace image**. Choose a JPG, PNG or WebP from the device, wait for the preview, then save the component. Uploading alone does not publish the image. Existing images remain until replaced or explicitly removed from a component.

Uploads require an administrator session. The server accepts files up to 10 MB / 40 megapixels, decodes and validates them, corrects orientation, resizes to fit within 2560 × 2560 without cropping, and stores an optimized WebP with transparency preserved. SVG, animated and non-image files are rejected. Original metadata is not retained.

Images are stored in MongoDB GridFS and served by the API at `/uploads/`; Vite proxies that path during development. Back up GridFS with the rest of the MongoDB database. If frontend and API domains differ, proxy `/uploads/` along with `/api/`. Replacing an image preserves older images that may still be referenced.
