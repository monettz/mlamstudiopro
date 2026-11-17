import { rejectUnlessAdmin } from "@/lib/admin";
import { boundedJson } from "@/lib/bounded-json";
import { database, ensureStore, json } from "@/lib/store";
import { MAX_PLAYLIST_ITEMS, playlistCaption, playlistImage, playlistLink } from "@/lib/homepage-media";
import { nextPosition, refreshHomepage } from "@/lib/homepage";

// Admin: adds a photo to the "From our plugins to your playlist" wall.
// Upload the image first with /api/product-images, then send its path here.
export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: Record<string, unknown>;
  try { const value = await boundedJson(request, 8192); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return json({ error: "Invalid photo" }, 400); }
  const image = playlistImage(body.image);
  if (!image) return json({ error: "Add a photo" }, 400);
  const url = playlistLink(body.url);
  if (url === null) return json({ error: "The song link must start with https://" }, 400);
  await ensureStore();
  const count = await database().prepare("SELECT COUNT(*) AS n FROM playlist_items").first<{ n: number }>();
  if (Number(count?.n ?? 0) >= MAX_PLAYLIST_ITEMS) return json({ error: `The wall holds up to ${MAX_PLAYLIST_ITEMS} photos. Delete one first.` }, 400);
  const caption = playlistCaption(body);
  const id = crypto.randomUUID();
  await database().prepare("INSERT INTO playlist_items (id,image,song,artist,producer,plugin,url,position,is_active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(id, image, caption.song, caption.artist, caption.producer, caption.plugin, url, await nextPosition("playlist_items"), 1, new Date().toISOString()).run();
  refreshHomepage();
  return json({ ok: true, id }, 201);
}
