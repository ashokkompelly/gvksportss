# MongoDB Atlas

The API supports `DATABASE_PROVIDER=mongodb` and `DATABASE_PROVIDER=sqlite`.
MongoDB mode uses Atlas for application records and GridFS for uploaded images.
The browser receives neither the connection string nor database credentials.

## Environment

`npm run dev` reads `.env.development`; `npm start` reads `.env`.
To use the same Atlas data in both, set these server-side variables in both files:

```dotenv
DATABASE_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/gvksportss?retryWrites=true&w=majority
MONGODB_DATABASE=gvksportss
MONGODB_RESOURCE_COLLECTION=resources
```

The supplied username and password are also stored in `MONGODB_USERNAME` and
`MONGODB_PASSWORD` for reference; the driver authenticates using `MONGODB_URI`.
Percent-encode special characters when constructing a URI. Keep these values
out of `VITE_*` variables, source control, and frontend configuration.
After changing environment files, restart the API.

This workspace now selects `gvk_db` with `MONGODB_RESOURCE_COLLECTION=new_gvk`.
Content is organized into the collections below. `new_gvk` is retained only as
the pre-migration backup. Accounts, sessions, reservations, audit history, and
uploads use their own collections within `gvk_db`.
The previous `gvksportss` database is retained as a backup.

## Managing content

| Collection         | Content                                               |
| ------------------ | ----------------------------------------------------- |
| `pages`            | Home, header, footer, and other editable page content |
| `events`           | Tournaments and events                                |
| `programs`         | Coaching programs                                     |
| `membership_plans` | Membership plans and prices                           |
| `coaching_slots`   | Bookable coaching sessions                            |
| `gallery`          | Gallery entries                                       |

Each document has its original numeric `id`, `kind`, `created_at`, `updated_at`,
and a native `content` object. Expand `content` in Atlas to inspect fields such
as `title`, `published`, `slug`, and page `config`; no JSON string parsing is
needed. For example, filter `pages` with `{ "content.slug": "home" }` or `events`
with `{ "content.published": true }`.

Use the admin portal for edits so validation, publishing rules, linked-record
checks, and audit entries apply. Saving in admin updates the appropriate
collection, and the public app reads it through the same API. The shared ID
sequence preserves existing booking and registration links.

The `_control` record with `_id: "content_layout"` selects the categorized
storage format. The application detects it automatically; the legacy collection
environment setting is retained for backups and migration tooling only.
Restart any old API processes after deploying these code changes.

To organize another existing installation after importing its data, run:

```bash
npm run db:organize-content
```

The command copies only CMS content, verifies every record, and switches the
layout in one transaction. It refuses to overwrite occupied destination
collections, preserves the source collection, and safely skips repeat runs.
The legacy collection is a snapshot, not a synchronized copy or a current
backup. Do not switch back to old application code after new content edits
without first migrating those changes back.

Local and hosted instances configured this way read and write the **same database**.
Editing content locally changes the shared Atlas content. There is no ongoing
two-way synchronization with SQLite. Set `DATABASE_PROVIDER=sqlite` and a local
`DATABASE_PATH` to work independently/offline with the retained SQLite database.

## Migration and verification

Stop SQLite app writes before migration. Configure Atlas credentials in `.env`, then run:

```bash
npm run db:check
npm run db:migrate:mongodb
```

The migration takes a consistent SQLite backup including committed WAL records
under `data/exports/before-atlas-*.sqlite`. It checks database integrity and foreign
keys, then imports every application table. Record IDs, password hashes, session
tokens, timestamps, and seed migration history are retained. Initial imports
use the legacy resource format; `db:organize-content` converts content to native
objects in the categorized collections while preserving the existing API format.

All record inserts and ID counters commit in one Atlas transaction. The script
refuses to overwrite a populated destination that differs from the snapshot.
An identical rerun verifies records and resumes any unfinished image transfer.
Every field is compared after import, and uploaded image bytes are verified.
Do not enable app traffic until the command reports completion.

Optional source paths:

```bash
npm run db:migrate:mongodb -- data/gvk-development.sqlite data/uploads
```

The SQLite source and upload directory remain untouched. Backups contain account
data and are ignored by Git. `db:export` continues to export SQLite only; it does
not back up new Atlas changes. Use Atlas backups or MongoDB database tools for
ongoing Atlas backups.

## Validation

```bash
npm test
npm run test:mongodb
npm run build
```

The Atlas test uses a randomly named `gvk_test_*` database and deletes only that
test database afterward. It exercises authentication, administrator permissions,
content editing, duplicate and concurrent registration checks, memberships,
bookings, rollback, enquiries, and uploaded image storage/serving.
Normal tests use temporary SQLite databases; the Atlas test skips without a URI.

`GET /api/health` pings Atlas and reports `database: "mongodb"` in MongoDB mode.

## Hosting

Set the same `DATABASE_PROVIDER`, `MONGODB_URI`, and `MONGODB_DATABASE` in the
hosting provider's server environment. Use `NODE_ENV=production` and the public
HTTPS origin as `APP_ORIGIN`. Allow the hosting server's outbound IP in Atlas
Network Access. Deploy the updated application code and built frontend.
The local `.env` file is not a deployment mechanism.

Uploaded images are in Atlas GridFS in MongoDB mode; bundled images in
`apps/web/public` remain part of the frontend build. No persistent local upload
volume is needed in MongoDB mode.

The application uses a shared write lock inside MongoDB transactions to preserve
capacity checks and linked-record rules across server instances. Writes are
serialized, which suits this small application; it is not optimized for heavy
write traffic. Rate limits remain per server process.
