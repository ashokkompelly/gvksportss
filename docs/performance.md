# Public-page loading improvements

## Findings (11 October 2026)

The live homepage returned HTTP 200. Public API reads returned MongoDB-backed JSON, but observations from the development environment took about 7–9 seconds per request (including network/proxy overhead). This is a baseline observation, not an isolated measurement of Atlas query latency or a promised end-user speedup.

The current request path contains verified avoidable work:

- Each new function instance creates/checks 32 indexes for categorized content, then checks the migration history in transactions before Express can serve requests.
- Header/footer and the active page independently request the same `/catalog/pages` payload; tab-focus events repeat requests.
- Public catalog and image reads run session lookup middleware when cookies exist.
- Event/session listings issue one count query per item.
- The initial public JavaScript bundle contains the full administrator editor.

## Changes

- Vercel runtime connections skip index provisioning and startup migrations by default. Run those explicitly with `npm run db:setup`. Local development retains automatic setup. `MONGODB_AUTO_SETUP=true` restores the previous startup behavior if needed.
- Keep the existing per-process MongoClient and failover architecture. Cache a negative legacy-layout lookup instead of repeating it on every resource read. After running content-organization migrations, redeploy/restart running instances.
- Skip session lookup on published catalog and immutable image endpoints; protected routes retain authentication.
- Pages/programs/plans/gallery/team share in-flight browser requests and a 30-second memory cache. Successful admin writes invalidate it and bypass CDN responses for immediate editor refreshes.
- Anonymous, MongoDB-backed catalog responses for those five content types can use Vercel's CDN for 30 seconds. Errors, fallback data, auth/member/admin responses, event lists and slot availability remain uncached. Independent visitors can see content up to approximately one minute old because browser and CDN TTLs can overlap. Do not use this cache for secrets or private documents; these endpoints already return only public content.
- Availability uses one grouped MongoDB query instead of one count per listing. The setup command adds a slot_id index to bookings. Registration indexes already start with event_id.
- Load the admin editor only when an administrator visits its route.

## Deploy

1. Review/merge this change and keep the existing MongoDB environment variables. No database provider change or content migration is introduced.
2. With server-side environment variables set to the intended database, run `npm run db:setup` from a trusted local terminal or a controlled release job. On an existing initialized database it creates missing indexes and skips already-applied migrations. For a new database this step is required before enabling writes. Do not place database credentials in frontend variables.
3. Deploy on Vercel. Keep `MONGODB_AUTO_SETUP` unset or `false` for the startup improvement.
4. Verify `/api/health` reports `mongodb`, public content renders, admin changes appear, and booking/login flows still work. Check repeat public API requests for `x-vercel-cache: HIT` using requests without cookies.
5. Compare cold and warm requests separately. If Atlas latency remains high, check the Atlas region and Vercel Function region and colocate them deliberately; this patch does not guess or change the database's region.

## Validation

- 16 targeted performance and existing SQLite-failover tests passed.
- Production build passed.
- Initial JS fell from 381.33 kB to 337.45 kB (about 11.5%); gzip fell from 116.95 kB to 106.08 kB. The 46.37 kB admin chunk is deferred until needed.
- Tests cover duplicate request coalescing, expiry, admin-save races, retry after failures, exclusion of private/live data from caching, aggregation shape, no schema writes on the optimized connection path, and fallback recovery.
- The full MongoDB integration suite requires a test replica set/Atlas connection and was not run without those credentials. No production database writes or deployment were performed during validation. Hosted before/after latency must be checked after deploying.

References: https://vercel.com/docs/caching/cache-control-headers and https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/
