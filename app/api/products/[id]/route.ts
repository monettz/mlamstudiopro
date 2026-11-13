import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";
import { boundedJson } from '@/lib/bounded-json';
import { validateDescriptionTranslations } from '@/lib/product-descriptions';
import { normalizeProductImages } from '@/lib/product-images';
import { refreshCatalog } from '@/lib/catalog';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: { image?: unknown; description_translations?: unknown; gallery_images?: unknown };
  try { const value=await boundedJson(request,256*1024);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();body=value; }
  catch { return json({ error: "Product image is required" }, 400); }
  await ensureStore();const {id}=await context.params;
  if(Object.hasOwn(body,'gallery_images')){
    const galleryImages=normalizeProductImages(body.gallery_images);
    if(galleryImages===null)return json({error:'Add up to 12 valid local or HTTPS product images'},400);
    const result=await database().prepare('UPDATE products SET gallery_images=?,updated_at=? WHERE id=?').bind(JSON.stringify(galleryImages ?? []),new Date().toISOString(),id).run();
    refreshCatalog(); return result.meta.changes?json({ok:true}):json({error:'Product not found'},404);
  }
  if(Object.hasOwn(body,'description_translations')){
    let translations;
    try{translations=validateDescriptionTranslations(body.description_translations);}catch{return json({error:'Use supported language codes and descriptions of at most 4000 characters.'},400);}
    const result=await database().prepare('UPDATE products SET description_translations=?,updated_at=? WHERE id=?').bind(JSON.stringify(translations),new Date().toISOString(),id).run();
    refreshCatalog(); return result.meta.changes?json({ok:true}):json({error:'Product not found'},404);
  }
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  if (!image || image.length > 2048 || (!image.startsWith("/") && !image.startsWith("https://")) || image.startsWith("//")) {
    return json({ error: "Use a local image path or HTTPS image URL" }, 400);
  }
  const result = await database().prepare("UPDATE products SET image=?,updated_at=? WHERE id=?")
    .bind(image, new Date().toISOString(), id).run();
  refreshCatalog(); return result.meta.changes ? json({ ok: true }) : json({ error: "Product not found" }, 404);
}

export async function PUT(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  let body:Record<string,unknown>;let translations:string|null=null;
  try {
    const input=await boundedJson(request,256*1024);if(!input||typeof input!=='object'||Array.isArray(input))throw new Error();body=input as Record<string,unknown>;
    if(Object.hasOwn(body,'description_translations'))translations=JSON.stringify(validateDescriptionTranslations(body.description_translations));
    if(typeof body.description!=='string'||body.description.length>4000)throw new Error();
  }catch{return json({error:'Invalid product descriptions or languages.'},400);}
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const category = String(body.category ?? "Plugin").trim() || "Plugin";
  const status = String(body.status ?? "draft");
  const priceCents = Number(body.price_cents ?? 0);
  const image = String(body.image ?? "").trim();
  if (!name || name.length > 120 || !slug || slug.length > 80 || category.length > 60) return json({ error: "Add a product name (up to 120 characters) and a valid slug" }, 400);
  if (!['draft', 'published', 'coming-soon'].includes(status)) return json({ error: "Status must be draft, published or coming soon" }, 400);
  if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 1_000_000) return json({ error: "Price must be between $0 and $10,000" }, 400);
  if (image && (image.length > 2048 || (!image.startsWith("/") && !image.startsWith("https://")) || image.startsWith("//"))) return json({ error: "Use a local image path or HTTPS image URL" }, 400);
  if (await database().prepare("SELECT id FROM products WHERE slug=? AND id<>?").bind(slug, id).first()) return json({ error: "Another product already uses this slug" }, 409);
  const features = Array.isArray(body.features) ? JSON.stringify(body.features.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, 20)) : "[]";
  const galleryImages=normalizeProductImages(body.gallery_images);
  if(galleryImages===null)return json({error:'Add up to 12 valid local or HTTPS product images'},400);
  const result = await database().prepare(`UPDATE products SET slug=?,name=?,category=?,description=?,price_cents=?,status=?,image=?,features=?,checkout_url=?,updated_at=?,description_translations=COALESCE(?,description_translations),gallery_images=COALESCE(?,gallery_images) WHERE id=?`)
    .bind(slug, name, category, body.description, priceCents, status, image, features, String(body.checkout_url ?? ""), new Date().toISOString(),translations,galleryImages ? JSON.stringify(galleryImages) : null,id).run();
  refreshCatalog(); return result.meta.changes ? json({ ok: true }) : json({ error: "Product not found" }, 404);
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  await database().batch([
    database().prepare("DELETE FROM products WHERE id=?").bind(id),
    database().prepare("DELETE FROM releases WHERE product_id=?").bind(id),
    database().prepare("DELETE FROM licenses WHERE product_id=?").bind(id),
  ]);
  refreshCatalog(); return json({ ok: true });
}
