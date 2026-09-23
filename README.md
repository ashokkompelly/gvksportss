# GVK Sportss — React + Node.js starter

A functional first version for badminton and chess coaching, memberships, events and content management. Designed for desktop, tablet and mobile, with an installable PWA shell. This is a runnable source project, not a hosted production service.

## Run locally

Requires Node.js 24 or later and npm.

```bash
npm install
cp .env.development.example .env.development
npm run dev
```

Open http://localhost:5173. Vite serves the React app and proxies `/api` to the Node API on port 3000. Development reads only `.env.development` and creates `data/gvk-development.sqlite`. Relative database paths resolve from the project root. Windows users can copy `.env.development.example` to `.env.development` in Explorer instead of running `cp`.

Production (`npm start`) reads `.env`; use `.env.example` as its template. Keep its database path and other settings separate from development. Both environment files and the local databases are ignored by Git. Restart the development server after changing environment settings.

## Create your first administrator

Add your own values to `.env.development`:

```dotenv
ADMIN_NAME=GVK Administrator
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-unique-password-at-least-12-characters
```

Run `npm run admin:create`, then remove `ADMIN_PASSWORD` from `.env.development`. Sign in at `/admin/login`. For production provisioning, use `.env` and the explicit `npm run admin:create:production` command. There are no shared/default administrator credentials. Signup always creates members and cannot assign administrator privileges. The command refuses to replace existing accounts.

## First setup in the admin portal

1. Edit the Home and About pages; retain slugs `home` and `about`.
2. Review the seeded coaching programs and publish your actual offerings.
3. Create membership plans with agreed prices and durations.
4. Create coaching sessions with dates, times, venues and capacity.
5. Create events and choose public registration or active-member access.
6. Add gallery image URLs. Images may be HTTPS URLs or files in `apps/web/public` referenced by `/filename`.
7. Review enquiries and membership requests in Overview. Activate membership only after verifying your agreed offline process.

No fee, session schedule or upcoming event was invented. Membership requests are pending until the administrator activates them; the validity period starts at activation. Prices are displayed but no payment is collected. The supplied launch poster is labelled as brand artwork, not a current event. Its printed weekday/year need confirmation before reusing it as an invitation.

## Included

- Public Home, About, Coaching, Events, Gallery and Contact pages.
- Member signup, login and logout with server-side sessions.
- Admin login and server-enforced role checks.
- Create, edit, publish/unpublish and delete pages, programs, events, sessions, plans and gallery entries.
- Additional CMS pages at `/pages/:slug`; custom page navigation is not yet configurable.
- Member dashboard with coaching bookings, event registration and cancellation.
- Membership request, admin activation, expiry checks and cancellation.
- Capacity enforcement, duplicate prevention and member booking overlap checks in database transactions.
- Member-only event/session access checks.
- Admin overview of accounts, bookings, registrations, membership requests and enquiries.
- Responsive mobile bottom navigation, tablet layouts, web manifest and offline fallback.
- Audit records for admin changes.

## Structure

- `apps/web/src/components/` — shared layout, form fields, loading/error/empty states.
- `apps/web/src/contexts/` — authentication context.
- `apps/web/src/pages/` — route-level public, member and admin screens.
- `apps/web/src/lib/` — API client and formatting helpers.
- `apps/web/public/` — assets, manifest and service worker.
- `apps/api/src/config/` — environment configuration.
- `apps/api/src/db/` — schema, transactions, resource helpers and one-time seed.
- `apps/api/src/modules/` — auth, catalog, members, admin and validation schemas.
- `apps/api/src/scripts/` — trusted administrator provisioning.
- `tests/` — API access and booking lifecycle integration tests.
- `docs/` — requirements, implementation decisions and phased roadmap.

This is a modular monolith. Keep modules together initially; extract individual controller/service/repository files when a module grows. Avoid microservices at this stage.

## Build and test

```bash
npm test
npm run build
```

To serve the built app locally from Node, set `APP_ORIGIN=http://localhost:3000` in `.env`, then run `npm start` and open that address. The Node server serves the built React app and API together.

For GoDaddy Node.js hosting, use `npm run build` as the build command and `npm start` as the startup command. Set `NODE_ENV=production`, set `APP_ORIGIN` to the hosted HTTPS URL, and do not start Vite separately. The production Node process serves the built frontend and API on the hosting provider's `PORT` value.

For a production Node host: use HTTPS, set `NODE_ENV=production`, set `APP_ORIGIN` to the exact public origin, choose a persistent `DATABASE_PATH`, build, and run `npm start`. HTTPS is necessary for Secure cookies and PWA features outside localhost. Do not use an ephemeral filesystem for the database. Do not enable proxy trust globally without configuring the exact trusted proxy topology. This starter's rate limit store is per process.

## Security implemented

Async scrypt password hashing with random salts; random opaque session tokens with hashed database storage; HttpOnly, SameSite cookies and Secure cookies in production; seven-day expiry; server logout invalidation; exact Origin enforcement on API writes; schema validation; parameterized SQL; auth/enquiry throttling; Helmet response headers; no authenticated response caching; ownership checks on member actions; no administrator self-signup; bounded request sizes.

Before a public launch, add verified email/password reset, automated backups and recovery testing, monitoring, approved privacy/terms and parental-account rules, and deployment-specific hardening. High-volume or multiple-server deployments should move to PostgreSQL and a shared rate limiter. Sessions currently have an absolute expiry, without sliding refresh.

## Current limits

- Local SQLite is for a single persistent Node process. PostgreSQL is the recommended production target when scaling.
- Gallery entries support image URLs, not direct uploads or video management.
- Membership is a manual request/approval flow; no payments, subscriptions, refunds or automated renewals.
- No email/SMS/WhatsApp sending, password reset or email verification yet.
- Booking cancellation is currently allowed anytime. Define cutoff/refund rules before launch.
- No coach management, recurring batches, attendance, court-resource conflict detection, parent/child profiles or tournament scoring yet.
- Sessions/events with reservations cannot change timing, venue, sport or access rules. Linked records cannot be deleted; unpublish instead.
- PWA provides installation metadata and an offline message. Viewing live data, booking and account operations require connectivity; push notifications are not implemented.
- The supplied team names are initial content in About; extend the CMS with a team module if these need admin editing.
- Content editor uses plain text. SEO prerendering/SSR and per-page metadata can follow before broader public marketing.

See `docs/REQUIREMENTS.md` for decisions to collect next.
