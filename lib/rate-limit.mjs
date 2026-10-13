import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { rawDatabase } from './node-runtime.mjs';

export const INVALID_CREDENTIALS = 'Either email or password is incorrect';
export const TOO_MANY_ATTEMPTS = 'Too many attempts. Please try again later.';
export function quotaKey(scope, subject) {
  return `quota:${createHash('sha256').update(JSON.stringify([scope, subject])).digest('hex')}`;
}

// Atomic admission: survives restarts and is shared by processes using the same DB.
// Fixed windows do not extend when an already blocked caller keeps retrying.
export function takeQuota(scope, subject, maximum, windowMs, now = Date.now()) {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) throw new Error('Invalid rate-limit configuration');
  const key = quotaKey(scope, subject);
  const db = rawDatabase();
  const row = db.prepare(`INSERT INTO auth_throttle (key, failures, reset_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET
      failures=CASE WHEN reset_at<=? THEN 1 ELSE failures+1 END,
      reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END
    WHERE reset_at<=? OR failures<? RETURNING failures,reset_at`)
    .get(key, now + windowMs, now, now, now, maximum);
  if (row) return { allowed: true, retryAfter: 0 };
  const blocked = db.prepare('SELECT reset_at FROM auth_throttle WHERE key=?').get(key);
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((Number(blocked.reset_at) - now) / 1000)) };
}
export function resetQuota(scope, subject) {
  rawDatabase().prepare('DELETE FROM auth_throttle WHERE key=?').run(quotaKey(scope, subject));
}

export function clientAddress(request) {
  // Never trust visitor-controlled X-Forwarded-For by default. Deployment must
  // explicitly enable this header AND configure the only reverse proxy to strip
  // and overwrite it with its TCP peer's address. Node remains loopback-only.
  if (process.env.MLAM_TRUST_PROXY_IP !== '1') return 'untrusted-shared';
  const address = request.headers.get('x-mlam-client-ip')?.trim();
  return address && isIP(address) ? address : 'untrusted-shared';
}
export function rateLimitedResponse(retryAfter) {
  return Response.json({ error: TOO_MANY_ATTEMPTS }, { status: 429, headers: {
    'Retry-After': String(Math.max(1, retryAfter)), 'Cache-Control': 'no-store'
  } });
}
