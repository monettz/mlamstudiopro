import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore();
  const result = await database().prepare(`SELECT orders.*, products.name AS product_name FROM orders LEFT JOIN products ON products.id=orders.product_id ORDER BY orders.created_at DESC`).all();
  return json({ orders: result.results ?? [] });
}
