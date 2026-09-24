# Admin image uploads

Every image field in the admin portal uses **Upload image** / **Replace image**. Choose a JPG, PNG or WebP from the device, wait for the preview, then save the component. Uploading alone does not publish the image. Existing images remain until replaced or explicitly removed from a component.

Uploads require an administrator session. The server accepts files up to 10 MB / 40 megapixels, decodes and validates them, corrects orientation, resizes to fit within 2560 × 2560 without cropping, and stores an optimized WebP with transparency preserved. SVG, animated and non-image files are rejected. Original metadata is not retained.

Files are stored outside the frontend build, in `uploads` beside the configured SQLite database by default. Set `UPLOAD_DIR` to override this location. The API serves them at `/uploads/`; Vite proxies that path during development.

In production, mount `UPLOAD_DIR` on persistent storage and back it up with the database. If the website uses separate frontend and API domains, proxy `/uploads/` to the API along with `/api/`. An ephemeral hosting filesystem will not retain uploads across deployments. Replacing an image does not delete the old file, since other components might still use it.

Image processing uses [Sharp](https://sharp.pixelplumbing.com/).
