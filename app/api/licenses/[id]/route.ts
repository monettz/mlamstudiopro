import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params; const body = await request.json() as { status?: string };
  await database().prepare("UPDATE licenses SET status=? WHERE id=?").bind(body.status === "revoked" ? "revoked" : "active", id).run();
  return json({ ok: true });
}
