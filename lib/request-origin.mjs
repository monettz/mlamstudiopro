export function trustedOrigin(request) {
  const expected = process.env.MLAM_ORIGIN || new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (!origin || origin !== expected) return false;
  const site = request.headers.get('sec-fetch-site');
  return !site || site === 'same-origin' || site === 'none';
}
