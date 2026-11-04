import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json, newLicense } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

// Issues the license for an order that does not have one yet.
export async function POST(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  const { id } = await context.params;
  let maxDownloads = 5;
  try { const body = await request.json() as { max_downloads?: unknown }; if (body?.max_downloads !== undefined) maxDownloads = Number(body.max_downloads); } catch { /* default limit */ }
  if (!Number.isInteger(maxDownloads) || maxDownloads < 1 || maxDownloads > 100) return json({ error: "Download limit must be between 1 and 100" }, 400);
  const db = database();
  const order = await db.prepare("SELECT orders.id,orders.product_id,orders.customer_email,orders.status,orders.license_id,products.name AS product_name FROM orders LEFT JOIN products ON products.id=orders.product_id WHERE orders.id=?").bind(id)
    .first<{ id: string; product_id: string; customer_email: string; status: string; license_id: string | null; product_name: string | null }>();
  if (!order) return json({ error: "Order not found" }, 404);
  if (order.license_id) return json({ error: "This order already has a license" }, 409);
  if (!["paid", "completed"].includes(order.status)) return json({ error: "Only paid orders can get a license" }, 409);
  const license = newLicense(order.product_id, order.customer_email, maxDownloads);
  await db.batch([license.statement, db.prepare("UPDATE orders SET license_id=? WHERE id=? AND license_id IS NULL").bind(license.id, id)]);
  return json({ ok: true, license_id: license.id, license_key: license.licenseKey, product_name: order.product_name }, 201);
}
