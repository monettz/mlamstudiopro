import { env } from "@/lib/runtime";
import { adminUser } from "@/lib/admin";
import { database, ensureStore } from "@/lib/store";
import { byteRange } from "@/lib/tutorial-media";

type Context = { params: Promise<{ id: string }> };

// Serves a hero image or video. Hidden items are only visible to the owner.
// Videos support byte ranges so phones can start playing straight away.
async function serve(request: Request, context: Context, head = false) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  await ensureStore();
  const item = await database().prepare("SELECT r2_key,content_type,is_active FROM hero_media WHERE id=?").bind(id).first<{ r2_key: string; content_type: string; is_active: number }>();
  if (!item || (!item.is_active && !await adminUser())) return new Response("Not found", { status: 404 });
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  const metadata = await bucket.head(item.r2_key);
  if (!metadata) return new Response("Not found", { status: 404 });
  const range = byteRange(request.headers.get("Range"), metadata.size);
  if (range === false) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${metadata.size}` } });
  // Each upload gets a new id, so a file never changes and can be cached for long.
  const headers = new Headers({ "Content-Type": item.content_type, "Accept-Ranges": "bytes", "Cache-Control": item.is_active ? "public, max-age=86400" : "no-store", "X-Content-Type-Options": "nosniff" });
  headers.set("Content-Length", String(range ? range.length : metadata.size));
  if (range) headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
  if (head) return new Response(null, { status: range ? 206 : 200, headers });
  const object = await bucket.get(item.r2_key, range ? { range } : undefined);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { status: range ? 206 : 200, headers });
}

export async function GET(request: Request, context: Context) { return serve(request, context); }
export async function HEAD(request: Request, context: Context) { return serve(request, context, true); }
