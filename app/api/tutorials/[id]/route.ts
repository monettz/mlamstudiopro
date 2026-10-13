import { rejectUnlessAdmin } from "@/lib/admin";
import { database, json } from "@/lib/store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: { published?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Choose a publication status" }, 400); }
  if (typeof body?.published !== "boolean") return json({ error: "Choose a publication status" }, 400);
  const { id } = await context.params;
  const result = await database().prepare("UPDATE tutorials SET is_published=? WHERE id=?").bind(body.published ? 1 : 0, id).run();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Video not found" }, 404);
}
