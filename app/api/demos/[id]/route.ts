import { env } from "@/lib/runtime";
import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";

// Removes the demo ZIP from storage and its row; an active demo stops showing Try.
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  const row = await database().prepare("SELECT r2_key FROM demo_releases WHERE id=?").bind(id).first<{ r2_key: string }>();
  if (!row) return json({ error: "Demo not found" }, 404);
  await (env as unknown as { RELEASES: LocalBucket }).RELEASES.delete(row.r2_key);
  await database().prepare("DELETE FROM demo_releases WHERE id=?").bind(id).run();
  return json({ ok: true });
}

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
