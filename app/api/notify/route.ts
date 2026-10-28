import { rejectUnlessAdmin } from '@/lib/admin';
import { database, ensureStore, json } from '@/lib/store';
import { clientAddress, rateLimitedResponse, takeQuota } from '@/lib/rate-limit.mjs';
import { boundedJson } from '@/lib/bounded-json';

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  const result = await database().prepare('SELECT n.id,n.product_id,n.email,n.created_at,p.name AS product_name FROM notify_requests n LEFT JOIN products p ON p.id=n.product_id ORDER BY n.created_at DESC').all();
  return json({ requests: result.results ?? [] });
}

// Public "Notify me when it launches" signup for coming-soon products.
export async function POST(request: Request) {
  const source = takeQuota('notify-source', clientAddress(request), 20, 15 * 60 * 1000);
  if (!source.allowed) return rateLimitedResponse(source.retryAfter);
  let productId = ''; let email = '';
  try {
    const input = await boundedJson(request) as Record<string, unknown>;
    productId = typeof input?.productId === 'string' ? input.productId.trim() : '';
    email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  } catch { /* fall through to validation */ }
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(productId) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400);
  const contact = takeQuota('notify-email', email, 5, 15 * 60 * 1000);
  if (!contact.allowed) return rateLimitedResponse(contact.retryAfter);
  await ensureStore();
  const product = await database().prepare("SELECT id FROM products WHERE id=? AND status='coming-soon'").bind(productId).first();
  if (!product) return json({ error: 'This product is not open for notifications.' }, 404);
  await database().prepare('INSERT OR IGNORE INTO notify_requests (id,product_id,email,created_at) VALUES (?,?,?,?)')
    .bind(crypto.randomUUID(), productId, email, new Date().toISOString()).run();
  return json({ ok: true });
}
