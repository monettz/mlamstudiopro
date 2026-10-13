import { env } from "@/lib/runtime";
import { rejectUnlessAdmin } from "@/lib/admin";
import { imageFormat, MAX_PRODUCT_IMAGE_BYTES } from "@/lib/product-image";
import { json } from "@/lib/store";

export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let form: FormData;
  try { form = await request.formData(); }
  catch { return json({ error: "Choose a product image" }, 400); }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json({ error: "Choose a product image" }, 400);
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) return json({ error: "Image must be 10 MB or smaller" }, 400);
  const data = await file.arrayBuffer();
  const format = imageFormat(new Uint8Array(data));
  if (!format) return json({ error: "Use a PNG, JPG or WEBP image" }, 400);
  const imageId = `${crypto.randomUUID()}.${format.extension}`;
  const bucket = (env as unknown as { RELEASES: LocalBucket }).RELEASES;
  await bucket.put(`product-images/${imageId}`, data, { httpMetadata: { contentType: format.contentType } });
  return json({ image: `/api/product-images/${imageId}` }, 201);
}
