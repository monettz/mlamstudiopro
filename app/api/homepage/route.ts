import { rejectUnlessAdmin } from "@/lib/admin";
import { json } from "@/lib/store";
import { adminHomepage } from "@/lib/homepage";

// Admin: everything in the Homepage section. The Featured Release product and
// its video are saved with the product (PUT /api/products/[id]).
export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  return json(await adminHomepage());
}
