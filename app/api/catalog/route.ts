import { database, listProducts } from "@/lib/store";

export async function GET() {
  const products = await listProducts(true);
  const result = await database().prepare("SELECT d.id,d.product_id,d.version FROM demo_releases d JOIN products p ON p.id=d.product_id WHERE d.is_active=1 AND p.status='published' ORDER BY d.created_at DESC").all();
  return Response.json({ products: products.map(({ id, name, price_cents, status }) => ({ id, name, price_cents, status })), demos: result.results ?? [] }, {
    headers: { "Cache-Control":"no-store" },
  });
}
