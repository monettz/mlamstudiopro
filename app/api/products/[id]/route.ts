import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";
import { boundedJson } from '@/lib/bounded-json';
import { validateDescriptionTranslations } from '@/lib/product-descriptions';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  let body: { image?: unknown;description_translations?:unknown };
  try { const value=await boundedJson(request,256*1024);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();body=value; }
  catch { return json({ error: "Product image is required" }, 400); }
  await ensureStore();const {id}=await context.params;
  if(Object.hasOwn(body,'description_translations')){
    let translations;
    try{translations=validateDescriptionTranslations(body.description_translations);}catch{return json({error:'Use supported language codes and descriptions of at most 4000 characters.'},400);}
    const result=await database().prepare('UPDATE products SET description_translations=?,updated_at=? WHERE id=?').bind(JSON.stringify(translations),new Date().toISOString(),id).run();
    return result.meta.changes?json({ok:true}):json({error:'Product not found'},404);
  }
  const image = typeof body?.image === "string" ? body.image.trim() : "";
  if (!image || image.length > 2048 || (!image.startsWith("/") && !image.startsWith("https://")) || image.startsWith("//")) {
    return json({ error: "Use a local image path or HTTPS image URL" }, 400);
  }
  const result = await database().prepare("UPDATE products SET image=?,updated_at=? WHERE id=?")
    .bind(image, new Date().toISOString(), id).run();
  return result.meta.changes ? json({ ok: true }) : json({ error: "Product not found" }, 404);
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
  const features = Array.isArray(body.features) ? JSON.stringify(body.features) : String(body.features ?? "[]");
  await database().prepare(`UPDATE products SET slug=?,name=?,category=?,description=?,price_cents=?,status=?,image=?,features=?,checkout_url=?,updated_at=?,description_translations=COALESCE(?,description_translations) WHERE id=?`)
    .bind(String(body.slug ?? ""), String(body.name ?? ""), String(body.category ?? "Plugin"), body.description, Number(body.price_cents ?? 0), String(body.status ?? "draft"), String(body.image ?? ""), features, String(body.checkout_url ?? ""), new Date().toISOString(),translations,id).run();
  return json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  await database().batch([
    database().prepare("DELETE FROM products WHERE id=?").bind(id),
    database().prepare("DELETE FROM releases WHERE product_id=?").bind(id),
    database().prepare("DELETE FROM licenses WHERE product_id=?").bind(id),
  ]);
  return json({ ok: true });
}
