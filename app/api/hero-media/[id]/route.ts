import { env } from "@/lib/runtime";
import { rejectUnlessAdmin } from "@/lib/admin";
import { boundedJson } from "@/lib/bounded-json";
import { database, ensureStore, json } from "@/lib/store";
import { moveItem, refreshHomepage } from "@/lib/homepage";

type Context = { params: Promise<{ id: string }> };

// Show or hide an item, or move it up or down in the slideshow.
export async function PATCH(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: { active?: unknown; move?: unknown };
  try { const value = await boundedJson(request, 4096); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); body = value; }
  catch { return json({ error: "Invalid change" }, 400); }
  await ensureStore(); const { id } = await context.params;
  if (!await database().prepare("SELECT id FROM hero_media WHERE id=?").bind(id).first()) return json({ error: "Item not found" }, 404);
  if (typeof body.active === "boolean") await database().prepare("UPDATE hero_media SET is_active=? WHERE id=?").bind(body.active ? 1 : 0, id).run();
  if (body.move === "up" || body.move === "down") await moveItem("hero_media", id, body.move);
  refreshHomepage();
  return json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  const row = await database().prepare("SELECT r2_key FROM hero_media WHERE id=?").bind(id).first<{ r2_key: string }>();
  if (!row) return json({ error: "Item not found" }, 404);
  await database().prepare("DELETE FROM hero_media WHERE id=?").bind(id).run();
  await (env as unknown as { RELEASES: LocalBucket }).RELEASES.delete(row.r2_key);
  refreshHomepage();
  return json({ ok: true });
}
