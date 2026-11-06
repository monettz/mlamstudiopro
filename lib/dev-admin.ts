import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Local-only admin sign-in for working on the dashboard before Supabase is set
// up. Any email and password are accepted, so it is fenced three ways:
//   1. never in production builds (next build / next start),
//   2. only when MLAM_DEV_ADMIN=1 is set explicitly,
//   3. only for requests to a loopback host (127.0.0.1, localhost, ::1).
// Sessions are signed with a key that lives only in this server process, so a
// restart signs everyone out.

export const DEV_ADMIN_COOKIE = 'mlam_dev_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

function signingKey(): Buffer {
  const store = globalThis as typeof globalThis & { __mlamDevAdminKey?: Buffer };
  store.__mlamDevAdminKey ??= randomBytes(32);
  return store.__mlamDevAdminKey;
}

export function devAdminEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== 'production' && env.MLAM_DEV_ADMIN === '1';
}

export function isLoopbackRequest(request: Request) {
  try { return LOOPBACK.has(new URL(request.url).hostname); } catch { return false; }
}

function signature(payload: string) {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

export function createDevAdminSession(email: string) {
  const cleanEmail = email.trim().toLowerCase().slice(0, 254) || 'owner@localhost';
  const payload = `${Buffer.from(cleanEmail).toString('base64url')}.${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`;
  return { value: `${payload}.${signature(payload)}`, maxAge: SESSION_SECONDS };
}

export function readDevAdminSession(value: string | undefined) {
  if (!value || !devAdminEnabled()) return null;
  const [encoded, expires, sig] = value.split('.');
  if (!encoded || !expires || !sig) return null;
  const expected = Buffer.from(signature(`${encoded}.${expires}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  const email = Buffer.from(encoded, 'base64url').toString('utf8');
  return { userId: `dev:${email}`, email, displayName: `${email} (local test)` };
}
