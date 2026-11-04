import { rejectUnlessAdmin } from "@/lib/admin";
import { boundedJson } from "@/lib/bounded-json";
import { emailConfigured, licenseEmail, sendEmail } from "@/lib/email";
import { database, ensureStore, json } from "@/lib/store";

const MAX_ANNOUNCEMENT_RECIPIENTS = 500;

async function supportEmail() {
  const row = await database().prepare("SELECT value FROM settings WHERE key='support_email'").first<{ value: string }>();
  return row?.value || undefined;
}

export async function GET() {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  return json({ configured: emailConfigured() });
}

// kind "license": email one customer their license key.
// kind "announcement": email everyone on a product's Notify list, one message each
// so recipients never see each other's addresses.
export async function POST(request: Request) {
  const denied = await rejectUnlessAdmin(); if (denied) return denied;
  if (!emailConfigured()) return json({ error: "Email sending is not set up. Add RESEND_API_KEY and MLAM_EMAIL_FROM.", code: "EMAIL_NOT_CONFIGURED" }, 503);
  let body: Record<string, unknown>;
  try { const value = await boundedJson(request, 32 * 1024); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(); body = value as Record<string, unknown>; }
  catch { return json({ error: "Invalid email request" }, 400); }
  await ensureStore();
  const db = database();
  const replyTo = await supportEmail();

  if (body.kind === "license") {
    const license = await db.prepare("SELECT licenses.customer_email,licenses.license_key,licenses.max_downloads,licenses.status,products.name AS product_name FROM licenses LEFT JOIN products ON products.id=licenses.product_id WHERE licenses.id=?")
      .bind(String(body.license_id ?? "")).first<{ customer_email: string; license_key: string; max_downloads: number; status: string; product_name: string | null }>();
    if (!license) return json({ error: "License not found" }, 404);
    if (license.status !== "active") return json({ error: "This license is revoked. Restore it before sending the key." }, 409);
    const message = licenseEmail({ productName: license.product_name ?? "MLAM plugin", licenseKey: license.license_key, maxDownloads: license.max_downloads });
    const result = await sendEmail({ to: license.customer_email, ...message, replyTo });
    return result.sent ? json({ ok: true, sent: 1 }) : json({ error: result.error }, 502);
  }

  if (body.kind === "announcement") {
    const productId = String(body.product_id ?? "");
    const subject = String(body.subject ?? "").trim();
    const text = String(body.message ?? "").trim();
    if (!subject || subject.length > 150 || !text || text.length > 5000) return json({ error: "Write a subject (up to 150 characters) and a message (up to 5000 characters)" }, 400);
    const recipients = (await db.prepare("SELECT email FROM notify_requests WHERE product_id=? ORDER BY created_at LIMIT ?").bind(productId, MAX_ANNOUNCEMENT_RECIPIENTS).all<{ email: string }>()).results ?? [];
    if (!recipients.length) return json({ error: "Nobody is on the launch list for this product" }, 404);
    let sent = 0; const failed: string[] = [];
    for (const { email } of recipients) {
      const result = await sendEmail({ to: email, subject, text, replyTo });
      if (result.sent) sent++; else failed.push(email);
    }
    return json({ ok: failed.length === 0, sent, failed }, failed.length && !sent ? 502 : 200);
  }

  return json({ error: "Unknown email type" }, 400);
}
