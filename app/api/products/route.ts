import { adminUser, rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json, listProducts } from "@/lib/store";
import { boundedJson } from '@/lib/bounded-json';
import { builtInTranslations,readDescriptionTranslations,productDescription,validateDescriptionTranslations } from '@/lib/product-descriptions';

export async function GET(request:Request) {
  const owner=!!(await adminUser());const products=await listProducts(!owner);
  if(owner)return json({products});
  const language=new URL(request.url).searchParams.get('language')||'en';
  return json({products:products.map(product=>({...product,
    description:productDescription(product,language).text,
    description_translations:JSON.stringify({...builtInTranslations(product),...readDescriptionTranslations(product.description_translations)}),
  }))});
}

export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  let body:Record<string,unknown>;
  let translations;
  try {
    const input=await boundedJson(request,256*1024);
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid product');
    body=input as Record<string,unknown>;
    translations=validateDescriptionTranslations(body.description_translations??{});
  }catch{return json({error:'Use supported languages and descriptions of at most 4000 characters.'},400);}
  if(typeof body.description!=='string'||body.description.length>4000)return json({error:'English description must be at most 4000 characters.'},400);
  const name = String(body.name ?? "").trim();
  if (!name) return json({ error: "Product name is required" }, 400);
  const id = crypto.randomUUID();
  const slug = String(body.slug ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = new Date().toISOString();
  const features = Array.isArray(body.features) ? JSON.stringify(body.features) : String(body.features ?? "[]");
  await database().prepare(`INSERT INTO products (id,slug,name,category,description,price_cents,status,image,features,checkout_url,created_at,updated_at,description_translations) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, slug, name, String(body.category ?? "Plugin"), body.description, Number(body.price_cents ?? 0), String(body.status ?? "draft"), String(body.image ?? "/plugins/mlam-voice-midi.png"), features, String(body.checkout_url ?? ""), now, now,JSON.stringify(translations)).run();
  return json({ ok: true, id }, 201);
}
