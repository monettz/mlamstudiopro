import { rejectUnlessAdmin } from '@/lib/admin';
import { database, ensureStore, json } from '@/lib/store';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const { id } = await context.params;
  await database().prepare('DELETE FROM notify_requests WHERE id=?').bind(id).run();
  return json({ ok: true });
}
