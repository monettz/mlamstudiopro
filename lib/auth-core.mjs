import { randomBytes, createHash, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { rawDatabase } from './node-runtime.mjs';
import { INVALID_CREDENTIALS, TOO_MANY_ATTEMPTS, takeQuota, resetQuota } from './rate-limit.mjs';
const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export const COOKIE_NAME = 'mlam_admin_session';
export function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1$${salt}$${scryptSync(password, salt, 64, options).toString('hex')}`;
}
export async function passwordHashAsync(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1$${salt}$${(await derive(password, salt, 64, options)).toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [version, salt, hash] = String(encoded).split('$');
  if (version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  const actual = await derive(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export const digestToken = token => createHash('sha256').update(token).digest('hex');
export function configuredAdmin() { return rawDatabase().prepare('SELECT id,email FROM admin_accounts LIMIT 1').get() ?? null; }
export function sessionUser(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  return rawDatabase().prepare('SELECT a.id,a.email FROM admin_sessions s JOIN admin_accounts a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?')
    .get(digestToken(token), Date.now()) ?? null;
}
export function revokeSession(token) {
  if (token) rawDatabase().prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(digestToken(token));
}
let verifying = false;
export async function loginAdmin(email, password) {
  const db = rawDatabase(); const now = Date.now();
  const admin = db.prepare('SELECT * FROM admin_accounts LIMIT 1').get();
  if (!admin) return { status: 503, error: 'Admin has not been configured on this server yet.' };
  const quota = takeQuota('admin-login-account', admin.id, 5, 15 * 60 * 1000, now);
  if (!quota.allowed) return { status: 429, error: TOO_MANY_ATTEMPTS, retryAfter: quota.retryAfter };
  if (verifying) return { status: 429, error: TOO_MANY_ATTEMPTS, retryAfter: 1 };
  verifying = true;
  try {
    const normalizedEmail = typeof email === 'string' && email.length <= 254 ? email.trim().toLowerCase() : '';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const passwordMatches = typeof password === 'string' && password.length <= 256 && await verifyPassword(password, admin.password_hash);
    if (!validEmail || normalizedEmail !== admin.email || !passwordMatches) return { status: 401, error: INVALID_CREDENTIALS };
    resetQuota('admin-login-account', admin.id);
    db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').run(now);
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO admin_sessions VALUES (?,?,?)').run(digestToken(token), admin.id, now + 8 * 60 * 60 * 1000);
    return { status: 200, token };
  } finally { verifying = false; }
}
