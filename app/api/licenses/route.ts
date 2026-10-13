import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json, keyForLicense } from "@/lib/store";

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  const result = await database().prepare(`SELECT licenses.*, products.name AS product_name FROM licenses LEFT JOIN products ON products.id=licenses.product_id ORDER BY licenses.created_at DESC`).all();
  return json({ licenses: result.results ?? [] });
}

export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const body = await request.json() as Record<string, unknown>;
  const productId = String(body.product_id ?? ""); const email = String(body.customer_email ?? "").trim().toLowerCase();
  if (!productId || !email) return json({ error: "Product and customer email are required" }, 400);
  const id = crypto.randomUUID(); const licenseKey = keyForLicense();
  await database().prepare(`INSERT INTO licenses (id,product_id,customer_email,license_key,status,download_count,max_downloads,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(id, productId, email, licenseKey, "active", 0, Number(body.max_downloads ?? 5), body.expires_at ? String(body.expires_at) : null, new Date().toISOString()).run();
  return json({ ok: true, id, license_key: licenseKey }, 201);
}
