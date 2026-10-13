import { env } from "@/lib/runtime";
import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json, type Release } from "@/lib/store";

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  const result = await database().prepare(`SELECT releases.*, products.name AS product_name FROM releases LEFT JOIN products ON products.id=releases.product_id ORDER BY releases.created_at DESC`).all<Release>();
  return json({ releases: result.results ?? [] });
}

export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: 'Choose a release ZIP' }, 400); }
  const file = form.get("file"); const productId = String(form.get("product_id") ?? "");
  const version = String(form.get("version") ?? "").trim();
  if (!(file instanceof File) || !productId || !version) return json({ error: "Product, version and ZIP are required" }, 400);
  if (!file.name.toLowerCase().endsWith(".zip") || file.size < 4 || file.size > 75 * 1024 * 1024) return json({ error: "Release must be a ZIP up to 75 MB" }, 400);
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b || !((signature[2] === 3 && signature[3] === 4) || (signature[2] === 5 && signature[3] === 6) || (signature[2] === 7 && signature[3] === 8))) return json({ error: 'Invalid ZIP signature' }, 400);
  if (!await database().prepare('SELECT id FROM products WHERE id=?').bind(productId).first()) return json({ error: 'Product not found' }, 400);
  if (version.length > 80) return json({ error: 'Version is too long' }, 400);
  const id = crypto.randomUUID(); const key = `releases/${productId}/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType: "application/zip" }, customMetadata: { productId, version } });
  try {
    await database().prepare(`INSERT INTO releases (id,product_id,version,r2_key,file_name,file_size,is_active,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(id, productId, version, key, file.name, file.size, 0, String(form.get("notes") ?? "").slice(0, 4000), new Date().toISOString()).run();
  } catch (error) { await bucket.delete(key); throw error; }
  return json({ ok: true, id }, 201);
}
