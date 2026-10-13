import { env } from "@/lib/runtime";
import { adminUser } from "@/lib/admin";
import { database } from "@/lib/store";
import { byteRange } from "@/lib/tutorial-media";

type Context = { params: Promise<{ id: string }> };

async function serve(request: Request, context: Context, head = false) {
  const { id } = await context.params;
  const tutorial = await database().prepare("SELECT r2_key,content_type,is_published FROM tutorials WHERE id=?").bind(id).first<{ r2_key: string; content_type: string; is_published: number }>();
  if (!tutorial || (!tutorial.is_published && !await adminUser())) return new Response("Video not found", { status: 404 });
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  const metadata = await bucket.head(tutorial.r2_key);
  if (!metadata) return new Response("Video not found", { status: 404 });
  const range = byteRange(request.headers.get("Range"), metadata.size);
  if (range === false) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${metadata.size}` } });
  const headers = new Headers({ "Content-Type": tutorial.content_type, "Accept-Ranges": "bytes", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  headers.set("Content-Length", String(range ? range.length : metadata.size));
  if (range) headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
  if (head) return new Response(null, { status: range ? 206 : 200, headers });
  const object = await bucket.get(tutorial.r2_key, range ? { range } : undefined);
  if (!object) return new Response("Video not found", { status: 404 });
  return new Response(object.body, { status: range ? 206 : 200, headers });
}

export async function GET(request: Request, context: Context) { return serve(request, context); }
export async function HEAD(request: Request, context: Context) { return serve(request, context, true); }
