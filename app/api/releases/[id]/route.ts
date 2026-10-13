import { env } from "@/lib/runtime";
import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params; const body = await request.json() as { active?: boolean };
  const row = await database().prepare("SELECT product_id FROM releases WHERE id=?").bind(id).first<{ product_id: string }>();
  if (!row) return json({ error: "Release not found" }, 404);
  const db = database();
  const changes = body.active ? [db.prepare("UPDATE releases SET is_active=0 WHERE product_id=?").bind(row.product_id)] : [];
  changes.push(db.prepare("UPDATE releases SET is_active=? WHERE id=?").bind(body.active ? 1 : 0, id));
  await db.batch(changes);
  return json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  const row = await database().prepare("SELECT r2_key FROM releases WHERE id=?").bind(id).first<{ r2_key: string }>();
  if (row) await (env as unknown as { RELEASES: LocalBucket }).RELEASES.delete(row.r2_key);
  await database().prepare("DELETE FROM releases WHERE id=?").bind(id).run();
  return json({ ok: true });
}
