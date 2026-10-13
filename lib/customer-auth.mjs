import { randomBytes, randomUUID } from 'node:crypto';
import { rawDatabase } from './node-runtime.mjs';
import { digestToken, passwordHashAsync, verifyPassword } from './auth-core.mjs';
import { INVALID_CREDENTIALS, TOO_MANY_ATTEMPTS, takeQuota, resetQuota } from './rate-limit.mjs';
export const CUSTOMER_COOKIE = 'mlam_customer_session';
export const REGISTER_NOTICE = 'If these details can be used, your account is ready to log in. Email verification is not available yet; purchases remain protected.';
export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
let inFlight = 0;
const busy = () => ({status:429,error:TOO_MANY_ATTEMPTS,retryAfter:1});
export async function registerCustomer(input) {
  const email = normalizeEmail(input?.email);
  const name = typeof input?.fullName === 'string' ? input.fullName.trim() : '';
  const password = input?.password;
  if (!email || name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name) || typeof password !== 'string' || password.length < 15 || password.length > 256) return {status:400,error:'Check your details. Use a password of at least 15 characters.'};
  const quota = takeQuota('customer-register-email', email, 3, 60 * 60 * 1000);
  if (!quota.allowed) return {status:429,error:TOO_MANY_ATTEMPTS,retryAfter:quota.retryAfter};
  if (inFlight >= 2) return busy();
  inFlight++;
  try {
    // Equal hashing work and response for existing/new addresses. Registration
    // never overwrites an existing customer's password or auto-signs in.
    const hash = await passwordHashAsync(password);
    rawDatabase().prepare('INSERT OR IGNORE INTO customers (id,email,full_name,password_hash,email_verified_at,created_at) VALUES (?,?,?,?,NULL,?)').run(randomUUID(),email,name,hash,new Date().toISOString());
    return {status:202,message:REGISTER_NOTICE};
  } finally { inFlight--; }
}
export async function loginCustomer(input) {
  const email = normalizeEmail(input?.email);
  const quota = takeQuota('customer-login-email', email || 'invalid-input', 5, 15 * 60 * 1000);
  if (!quota.allowed) return {status:429,error:TOO_MANY_ATTEMPTS,retryAfter:quota.retryAfter};
  if (inFlight >= 2) return busy();
  const password = input?.password;
  if (!email || typeof password !== 'string' || password.length > 256) return {status:401,error:INVALID_CREDENTIALS};
  const db = rawDatabase();
  const customer = db.prepare('SELECT id,password_hash FROM customers WHERE email=?').get(email);
  // Unknown emails get the same scrypt work and outward error as wrong passwords.
  const dummyHash = `scrypt-v1$${'0'.repeat(32)}$${'0'.repeat(128)}`;
  inFlight++;
  try {
    const correct = await verifyPassword(password, customer?.password_hash || dummyHash);
    if (!customer || !correct) return {status:401,error:INVALID_CREDENTIALS};
    resetQuota('customer-login-email',email);
    const now=Date.now(); const token=randomBytes(32).toString('hex');
    db.prepare('DELETE FROM customer_sessions WHERE expires_at<=?').run(now);
    db.prepare('INSERT INTO customer_sessions VALUES (?,?,?)').run(digestToken(token),customer.id,now+8*60*60*1000);
    return {status:200,token};
  } finally { inFlight--; }
}
export function customerSession(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  return rawDatabase().prepare('SELECT c.id,c.email,c.full_name,c.email_verified_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=? AND s.expires_at>?').get(digestToken(token),Date.now()) ?? null;
}
export function revokeCustomerSession(token) {
  if (token) rawDatabase().prepare('DELETE FROM customer_sessions WHERE token_hash=?').run(digestToken(token));
}
export function safeAccountReturn(value) {
  if (typeof value !== 'string' || value.length>500 || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/account';
  try { const url=new URL(value,'https://mlam.local'); return url.origin==='https://mlam.local' && ['/account','/checkout','/downloads'].includes(url.pathname) ? url.pathname+url.search+url.hash : '/account'; } catch { return '/account'; }
}
