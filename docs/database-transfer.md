# Exporting local content for production

Run `npm run db:export` from the project root. This reads `data/gvk-development.sqlite` using SQLite's backup API, including committed updates in its WAL file. The source database is not replaced or migrated. A timestamped, standalone database is written to `data/exports/` and checked for integrity. No `-wal` or `-shm` files are needed for this export.

For another source or destination, use:

```sh
npm run db:export -- data/gvk-development.sqlite data/my-export.sqlite
```

The command refuses to overwrite an existing destination. Save all admin edits before exporting. Edits made after the snapshot require another export.

The snapshot includes the entire database: website content, accounts, sessions, bookings and registrations. It is not a content-only merge. Back up production first, and do not replace it if live records must be preserved.

To install it, stop every production API process, back up the existing database and any companion WAL/SHM files together, then place the exported database at the exact production `DATABASE_PATH`. Never pair an exported database with old production WAL/SHM files. Restart the API after the replacement. If transferring through Git, the export can be renamed to `data/gvk.sqlite`, but only replace the local destination while no local process is using it. A production path outside the deployment checkout avoids later pulls replacing live changes.

Uploaded images are not embedded in SQLite. Transfer the files from the local upload directory to production's `UPLOAD_DIR`, preserving names. This project's `data/uploads/` is ignored by Git, so a normal push does not include those images. See [image uploads](image-uploads.md).

Database exports contain account information; keep them out of public repositories.
