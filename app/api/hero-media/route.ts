import { env } from "@/lib/runtime";
import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";
import { imageFormat } from "@/lib/product-image";
import { videoFormat } from "@/lib/tutorial-media";
import { heroVideoTooLong, MAX_HERO_IMAGE_BYTES, MAX_HERO_ITEMS, MAX_HERO_VIDEO_BYTES, videoDurationMs } from "@/lib/homepage-media";
import { heroFileUrl, nextPosition, refreshHomepage } from "@/lib/homepage";

// Uploads one hero slideshow item: an image, or a video of at most 6 seconds.
export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: "Choose an image or a short video" }, 400); }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return json({ error: "Choose an image or a short video" }, 400);
  if (file.size > MAX_HERO_VIDEO_BYTES) return json({ error: "Files must be 15 MB or smaller" }, 400);
  await ensureStore();
  const count = await database().prepare("SELECT COUNT(*) AS n FROM hero_media").first<{ n: number }>();
  if (Number(count?.n ?? 0) >= MAX_HERO_ITEMS) return json({ error: `The hero holds up to ${MAX_HERO_ITEMS} items. Delete one first.` }, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = imageFormat(bytes);
  const video = image ? null : videoFormat(bytes.slice(0, 4096));
  if (!image && !video) return json({ error: "Use a JPG, PNG or WEBP image, or an MP4 or WEBM video" }, 400);
  let durationMs = 0;
  if (image && file.size > MAX_HERO_IMAGE_BYTES) return json({ error: "Images must be 8 MB or smaller" }, 400);
  if (video) {
    const measured = videoDurationMs(bytes, video);
    if (measured === null) return json({ error: "The video length could not be read. Export it again as a normal MP4." }, 400);
    if (heroVideoTooLong(measured)) return json({ error: `This video is ${(measured / 1000).toFixed(1)} seconds long. Hero videos can be at most 6 seconds.` }, 400);
    durationMs = measured;
  }

  const id = crypto.randomUUID();
  const contentType = image ? image.contentType : video!;
  const extension = image ? image.extension : video === "video/webm" ? "webm" : "mp4";
  const key = `hero/${id}.${extension}`;
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  await bucket.put(key, bytes.buffer as ArrayBuffer, { httpMetadata: { contentType } });
  try {
    await database().prepare("INSERT INTO hero_media (id,kind,r2_key,content_type,file_name,file_size,duration_ms,position,is_active,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(id, image ? "image" : "video", key, contentType, file.name.slice(0, 200), file.size, durationMs, await nextPosition("hero_media"), 1, new Date().toISOString()).run();
  } catch (error) { await bucket.delete(key); throw error; }
  refreshHomepage();
  return json({ ok: true, id, src: heroFileUrl(id) }, 201);
}
