import { env } from "@/lib/runtime";
import { adminUser, rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";
import { MAX_TUTORIAL_BYTES, videoFormat } from "@/lib/tutorial-media";

export async function GET() {
  const admin = await adminUser();
  const result = await database().prepare(`SELECT t.id,t.product_id,t.title,t.description,t.file_name,t.file_size,t.is_published,t.created_at,p.name AS product_name,p.image AS product_image FROM tutorials t LEFT JOIN products p ON p.id=t.product_id ${admin ? "" : "WHERE t.is_published=1"} ORDER BY t.created_at DESC`).all();
  return json({ tutorials: result.results ?? [] });
}

export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let form: FormData;
  try { form = await request.formData(); }
  catch { return json({ error: "Choose a video and add a title" }, 400); }
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const productId = String(form.get("product_id") ?? "").trim();
  if (!(file instanceof File) || !file.size || !title || title.length > 160 || description.length > 2000) return json({ error: "Add a video, title (up to 160 characters) and a short description" }, 400);
  if (file.size > MAX_TUTORIAL_BYTES) return json({ error: "Video must be 50 MB or smaller" }, 400);
  const contentType = videoFormat(new Uint8Array(await file.slice(0, 4096).arrayBuffer()));
  if (!contentType) return json({ error: "Use an MP4 or WEBM video" }, 400);
  await ensureStore();
  if (productId && !await database().prepare("SELECT id FROM products WHERE id=?").bind(productId).first()) return json({ error: "Product not found" }, 400);
  const id = crypto.randomUUID();
  const key = `tutorials/${id}.${contentType === "video/mp4" ? "mp4" : "webm"}`;
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  await bucket.put(key, file.stream(), { httpMetadata: { contentType } });
  try {
    await database().prepare("INSERT INTO tutorials (id,product_id,title,description,r2_key,file_name,content_type,file_size,is_published,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(id, productId || null, title, description, key, file.name, contentType, file.size, form.get("published") === "on" ? 1 : 0, new Date().toISOString()).run();
  } catch (error) { await bucket.delete(key); throw error; }
  return json({ ok: true, id }, 201);
}
