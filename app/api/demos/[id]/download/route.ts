import { env } from "@/lib/runtime";
import { database } from "@/lib/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const release = await database().prepare("SELECT d.r2_key,d.file_name FROM demo_releases d JOIN products p ON p.id=d.product_id WHERE d.id=? AND d.is_active=1 AND p.status='published'").bind(id).first<{ r2_key:string; file_name:string }>();
  if (!release || !release.r2_key.startsWith("demos/")) return new Response("Demo not available", { status:404 });
  const object = await (env as unknown as { RELEASES:LocalBucket }).RELEASES.get(release.r2_key);
  if (!object) return new Response("Demo file not found", { status:404 });
  const headers = new Headers({ "Content-Type":"application/zip", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" });
  headers.set("Content-Disposition", `attachment; filename="${release.file_name.replace(/[\r\n"\\]/g, "")}"`);
  return new Response(object.body, { headers });
}
