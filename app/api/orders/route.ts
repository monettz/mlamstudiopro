import { rejectUnlessAdmin } from "@/lib/admin";
import { boundedJson } from "@/lib/bounded-json";
import { parseManualOrder } from "@/lib/manual-order";
import { database, ensureStore, json, newLicense } from "@/lib/store";

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  const result = await database().prepare(`SELECT orders.*, products.name AS product_name, licenses.license_key, licenses.max_downloads FROM orders LEFT JOIN products ON products.id=orders.product_id LEFT JOIN licenses ON licenses.id=orders.license_id ORDER BY orders.created_at DESC`).all();
  return json({ orders: result.results ?? [] });
}

// Records a payment the owner received outside the website (M-Pesa, bank, cash)
// and, by default, issues the license for it in the same transaction.
export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let input: unknown;
  try { input = await boundedJson(request); } catch { return json({ error: "Fill in the payment details" }, 400); }
  const parsed = parseManualOrder(input);
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const { order } = parsed;
  await ensureStore();
  const db = database();
  const product = await db.prepare("SELECT id,name FROM products WHERE id=?").bind(order.productId).first<{ id: string; name: string }>();
  if (!product) return json({ error: "Product not found" }, 404);
  if (order.reference && await db.prepare("SELECT id FROM orders WHERE provider_ref=?").bind(order.reference).first()) {
    return json({ error: `Transaction ${order.reference} is already recorded` }, 409);
  }
  const id = crypto.randomUUID();
  const license = order.issueLicense ? newLicense(order.productId, order.email, order.maxDownloads) : null;
  const insertOrder = db.prepare(`INSERT INTO orders (id,product_id,customer_email,amount_cents,status,provider_ref,created_at,payment_method,currency,customer_phone,license_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, order.productId, order.email, order.amountMinor, "paid", order.reference, new Date().toISOString(), order.method, order.currency, order.phone, license?.id ?? null);
  await db.batch(license ? [license.statement, insertOrder] : [insertOrder]);
  return json({ ok: true, id, license_id: license?.id ?? null, license_key: license?.licenseKey ?? null, product_name: product.name }, 201);
}
