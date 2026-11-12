// Same-origin guard for mutating requests (CSRF defence).
// With MLAM_ORIGIN set (production), only that exact origin is accepted.
// Without it, the origin the browser actually addressed (the Host header) is
// used. `request.url` is not reliable here: `next dev` rewrites it to
// `localhost` even when the browser is on 127.0.0.1, which used to block every
// local form POST (admin login, customer login, registration) with a 403.
function requestOrigins(request) {
  const url = new URL(request.url);
  const origins = new Set([url.origin]);
  const host = request.headers.get('host');
  if (host && /^[a-z0-9.\-:[\]]+$/i.test(host)) origins.add(`${url.protocol}//${host.toLowerCase()}`);
  return origins;
}

export function trustedOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const allowed = process.env.MLAM_ORIGIN ? new Set([process.env.MLAM_ORIGIN]) : requestOrigins(request);
  if (!allowed.has(origin)) return false;
  const site = request.headers.get('sec-fetch-site');
  return !site || site === 'same-origin' || site === 'none';
}
