import { env } from "@/lib/runtime";
import { adminUser, rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";

export async function GET() {
  const admin = await adminUser();
  const result = await database().prepare(`SELECT d.id,d.product_id,d.version,d.file_name,d.file_size,d.is_active,d.notes,p.name AS product_name FROM demo_releases d JOIN products p ON p.id=d.product_id ${admin ? "" : "WHERE d.is_active=1 AND p.status='published'"} ORDER BY d.created_at DESC`).all();
  return json({ demos: result.results ?? [] });
}

export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: "Choose a demo ZIP" }, 400); }
  const file = form.get("file");
  const productId = String(form.get("product_id") ?? "").trim();
  const version = String(form.get("version") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  if (!(file instanceof File) || !file.size || !productId || !version || version.length > 50 || notes.length > 2000) return json({ error: "Product, version and demo ZIP are required" }, 400);
  if (file.size > 75 * 1024 * 1024) return json({ error: "Demo ZIP must be 75 MB or smaller" }, 400);
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (!file.name.toLowerCase().endsWith(".zip") || signature[0] !== 80 || signature[1] !== 75 || !((signature[2] === 3 && signature[3] === 4) || (signature[2] === 5 && signature[3] === 6))) return json({ error: "Choose a valid ZIP file" }, 400);
  await ensureStore();
  if (!await database().prepare("SELECT id FROM products WHERE id=?").bind(productId).first()) return json({ error: "Product not found" }, 400);
  const id = crypto.randomUUID();
  const key = `demos/${productId}/${id}.zip`;
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType: "application/zip" } });
  try {
    await database().prepare("INSERT INTO demo_releases (id,product_id,version,r2_key,file_name,file_size,is_active,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(id, productId, version, key, file.name, file.size, 0, notes, new Date().toISOString()).run();
  } catch (error) { await bucket.delete(key); throw error; }
  return json({ ok: true, id }, 201);
}
