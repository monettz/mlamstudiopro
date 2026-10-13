import { rejectUnlessAdmin } from "@/lib/admin";
import { database, ensureStore, json } from "@/lib/store";

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const result = await database().prepare("SELECT key,value FROM settings ORDER BY key").all<{ key: string; value: string }>();
  return json({ settings: Object.fromEntries((result.results ?? []).map((x: { key: string; value: string }) => [x.key, x.value])) });
}

export async function PUT(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  await ensureStore(); const body = await request.json() as Record<string, unknown>;
  for (const [key, value] of Object.entries(body)) await database().prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(key, String(value)).run();
  return json({ ok: true });
}
