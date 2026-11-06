import { randomBytes, createHash, scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from './database.mjs';
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
export function configuredAdmin() { return db.prepare('SELECT id,email FROM admin_accounts LIMIT 1').first(); }
export async function sessionUser(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  return db.prepare('SELECT a.id,a.email FROM admin_sessions s JOIN admin_accounts a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?')
    .bind(digestToken(token), Date.now()).first();
}
export async function revokeSession(token) {
  if (token) await db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(digestToken(token)).run();
}
let verifying = false;
export async function loginAdmin(email, password) {
  const now = Date.now();
  const admin = await db.prepare('SELECT * FROM admin_accounts LIMIT 1').first();
  if (!admin) return { status: 503, error: 'Admin has not been configured on this server yet.' };
  const quota = await takeQuota('admin-login-account', admin.id, 5, 15 * 60 * 1000, now);
  if (!quota.allowed) return { status: 429, error: TOO_MANY_ATTEMPTS, retryAfter: quota.retryAfter };
  if (verifying) return { status: 429, error: TOO_MANY_ATTEMPTS, retryAfter: 1 };
  verifying = true;
  try {
    const normalizedEmail = typeof email === 'string' && email.length <= 254 ? email.trim().toLowerCase() : '';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const passwordMatches = typeof password === 'string' && password.length <= 256 && await verifyPassword(password, admin.password_hash);
    if (!validEmail || normalizedEmail !== admin.email || !passwordMatches) return { status: 401, error: INVALID_CREDENTIALS };
    await resetQuota('admin-login-account', admin.id);
    await db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(now).run();
    const token = randomBytes(32).toString('hex');
    await db.prepare('INSERT INTO admin_sessions VALUES (?,?,?)').bind(digestToken(token), admin.id, now + 8 * 60 * 60 * 1000).run();
    return { status: 200, token };
  } finally { verifying = false; }
}
