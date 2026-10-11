const cacheable = new Set(['pages', 'programs', 'plans', 'gallery', 'team']);
export function catalogCacheHeaders(req, res, backend) {
  // Only anonymous, successfully read, non-capacity content may enter the shared cache.
  if (
    backend !== 'mongodb' ||
    !cacheable.has(req.params.kind) ||
    req.headers.cookie ||
    req.query.fresh
  )
    return;
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=30');
}
