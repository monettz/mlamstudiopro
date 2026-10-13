import { rejectUnlessAdmin } from "@/lib/admin";
import { database, json } from "@/lib/store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: { active?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Choose demo status" }, 400); }
  if (typeof body?.active !== "boolean") return json({ error: "Choose demo status" }, 400);
  const { id } = await context.params;
  const row = await database().prepare("SELECT product_id FROM demo_releases WHERE id=?").bind(id).first<{ product_id:string }>();
  if (!row) return json({ error: "Demo not found" }, 404);
  const db = database();
  const updates = [];
  if (body.active) updates.push(db.prepare("UPDATE demo_releases SET is_active=0 WHERE product_id=?").bind(row.product_id));
  updates.push(db.prepare("UPDATE demo_releases SET is_active=? WHERE id=?").bind(body.active ? 1 : 0, id));
  await db.batch(updates);
  return json({ ok: true });
}
