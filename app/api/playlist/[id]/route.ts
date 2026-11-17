import { rejectUnlessAdmin } from "@/lib/admin";
import { boundedJson } from "@/lib/bounded-json";
import { database, ensureStore, json } from "@/lib/store";
import { playlistCaption, playlistLink } from "@/lib/homepage-media";
import { moveItem, refreshHomepage } from "@/lib/homepage";

type Context = { params: Promise<{ id: string }> };

// Admin: edit captions, show/hide, or move a playlist photo.
export async function PATCH(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: Record<string, unknown>;
  try { const value = await boundedJson(request, 8192); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return json({ error: "Invalid change" }, 400); }
  await ensureStore(); const { id } = await context.params;
  if (!await database().prepare("SELECT id FROM playlist_items WHERE id=?").bind(id).first()) return json({ error: "Photo not found" }, 404);
  if (["song", "artist", "producer", "plugin", "url"].some(key => Object.hasOwn(body, key))) {
    const url = playlistLink(body.url);
    if (url === null) return json({ error: "The song link must start with https://" }, 400);
    const caption = playlistCaption(body);
    await database().prepare("UPDATE playlist_items SET song=?,artist=?,producer=?,plugin=?,url=? WHERE id=?").bind(caption.song, caption.artist, caption.producer, caption.plugin, url, id).run();
  }
  if (typeof body.active === "boolean") await database().prepare("UPDATE playlist_items SET is_active=? WHERE id=?").bind(body.active ? 1 : 0, id).run();
  if (body.move === "up" || body.move === "down") await moveItem("playlist_items", id, body.move);
  refreshHomepage();
  return json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  const result = await database().prepare("DELETE FROM playlist_items WHERE id=?").bind(id).run();
  refreshHomepage();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Photo not found" }, 404);
}
