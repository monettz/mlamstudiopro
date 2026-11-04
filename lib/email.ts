// Outgoing email through Resend (https://resend.com) when RESEND_API_KEY and
// MLAM_EMAIL_FROM are set. Without them nothing is sent and the admin falls
// back to opening the owner's own email app.

export type EmailResult = { sent: true } | { sent: false; error: string };

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY?.trim() && !!process.env.MLAM_EMAIL_FROM?.trim();
}

export async function sendEmail({ to, subject, text, replyTo }: { to: string; subject: string; text: string; replyTo?: string }): Promise<EmailResult> {
  if (!emailConfigured()) return { sent: false, error: 'Email sending is not set up' };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MLAM_EMAIL_FROM!.trim(), to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (response.ok) return { sent: true };
    const detail = await response.json().catch(() => ({})) as { message?: string };
    return { sent: false, error: detail.message ? `Email provider: ${detail.message}` : `Email provider returned ${response.status}` };
  } catch {
    return { sent: false, error: 'Could not reach the email provider' };
  }
}

export function siteOrigin() {
  return (process.env.MLAM_ORIGIN || 'http://127.0.0.1:4180').replace(/\/$/, '');
}

export function licenseEmail({ productName, licenseKey, maxDownloads, origin = siteOrigin() }: { productName: string; licenseKey: string; maxDownloads: number; origin?: string }) {
  return {
    subject: `Your ${productName} license key`,
    text: [
      `Thank you for buying ${productName} from MLAM Studio Pro.`,
      '',
      `Your license key: ${licenseKey}`,
      '',
      'To download:',
      `1. Open ${origin}/downloads`,
      '2. Enter the license key above',
      '3. Install the VST3 plugin and rescan plugins in your DAW (64-bit Windows).',
      '',
      `This key includes ${maxDownloads} download${maxDownloads === 1 ? '' : 's'}. Keep this email safe.`,
      '',
      'Need help? Reply to this email.',
      '— MLAM Studio Pro',
    ].join('\n'),
  };
}
