import { env } from "@/lib/runtime";
import { database, ensureStore, json } from "@/lib/store";
type Context = { params: Promise<{ licenseKey: string }> };

export async function GET(_request: Request, context: Context) {
  await ensureStore(); const { licenseKey } = await context.params;
  const license = await database().prepare("SELECT * FROM licenses WHERE license_key=?").bind(licenseKey.toUpperCase()).first<{ id: string; product_id: string; status: string; download_count: number; max_downloads: number; expires_at: string | null }>();
  if (!license || license.status !== "active") return json({ error: "Invalid or inactive license" }, 403);
  if (license.expires_at && !(new Date(license.expires_at).getTime() > Date.now())) return json({ error: "License expired" }, 403);
  if (license.download_count >= license.max_downloads) return json({ error: "Download limit reached" }, 403);
  const release = await database().prepare("SELECT r2_key,file_name FROM releases WHERE product_id=? AND is_active=1 ORDER BY created_at DESC LIMIT 1").bind(license.product_id).first<{ r2_key: string; file_name: string }>();
  if (!release || !release.r2_key.startsWith('releases/')) return json({ error: "No active release available" }, 404);
  const object = await (env as unknown as { RELEASES: LocalBucket }).RELEASES.get(release.r2_key);
  if (!object) return json({ error: "Release file not found" }, 404);
  const claimed = await database().prepare("UPDATE licenses SET download_count=download_count+1 WHERE id=? AND status='active' AND download_count<max_downloads RETURNING id").bind(license.id).first();
  if (!claimed) { await object.body.cancel(); return json({ error: 'Download limit reached or license inactive' }, 403); }
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("Content-Disposition", `attachment; filename="${release.file_name.replace(/[\r\n"\\]/g, '')}"`); headers.set("Cache-Control", "private, no-store");
  return new Response(object.body, { headers });
}
