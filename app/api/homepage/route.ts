import { rejectUnlessAdmin } from "@/lib/admin";
import { boundedJson } from "@/lib/bounded-json";
import { database, ensureStore, json } from "@/lib/store";
import { youtubeId } from "@/lib/homepage-media";
import { adminHomepage, refreshHomepage } from "@/lib/homepage";

// Admin: everything in the Homepage section.
export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  return json(await adminHomepage());
}

// Admin: the Featured Release video (a YouTube link or id, plus a title).
export async function PUT(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: { video?: unknown; title?: unknown };
  try { const value = await boundedJson(request, 4096); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); body = value; }
  catch { return json({ error: "Invalid video" }, 400); }
  const id = youtubeId(body.video ?? "");
  if (id === null) return json({ error: "Paste a YouTube video link, for example https://www.youtube.com/watch?v=…" }, 400);
  const title = typeof body.title === "string" ? body.title.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  await ensureStore();
  const save = (key: string, value: string) => database().prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(key, value);
  await database().batch([save("featured_video_id", id), save("featured_video_title", title)]);
  refreshHomepage();
  return json({ ok: true, id, title });
}
