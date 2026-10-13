import { database, ensureStore, json } from '@/lib/store';
import { clientAddress, rateLimitedResponse, takeQuota } from '@/lib/rate-limit.mjs';
import { checkoutInput } from '@/lib/checkout-input';
import { boundedJson } from '@/lib/bounded-json';
export async function POST(request: Request) {
  const source = takeQuota('checkout-source', clientAddress(request), 20, 15 * 60 * 1000);
  if (!source.allowed) return rateLimitedResponse(source.retryAfter);
  let input;
  try { input = checkoutInput(await boundedJson(request)); }
  catch { return json({ error: 'Check your checkout details and try again.' }, 400); }
  if (!input) return json({ error: 'Check your checkout details and try again.' }, 400);
  // An email is an additional anti-spam identifier, not verified identity.
  const contact = takeQuota('checkout-email', input.email, 5, 15 * 60 * 1000);
  if (!contact.allowed) return rateLimitedResponse(contact.retryAfter);
  await ensureStore();
  const product = await database().prepare("SELECT id FROM products WHERE id=? AND status='published' AND price_cents>0").bind(input.productId).first();
  if (!product) return json({ error: 'This product cannot be purchased yet.' }, 404);
  // No PII, order, charge or license is saved while payment is unconfigured.
  return json({ code: 'PAYMENT_NOT_CONFIGURED', error: 'Payments are not available yet. No payment was taken, no order was created, and your contact details were not saved.' }, 503);
}
