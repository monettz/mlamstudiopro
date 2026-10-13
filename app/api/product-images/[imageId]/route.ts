import { env } from "@/lib/runtime";

export async function GET(_request: Request, context: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await context.params;
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.(?:png|jpg|webp)$/.test(imageId)) {
    return new Response("Image not found", { status: 404 });
  }
  const object = await (env as unknown as { RELEASES: LocalBucket }).RELEASES.get(`product-images/${imageId}`);
  if (!object) return new Response("Image not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
