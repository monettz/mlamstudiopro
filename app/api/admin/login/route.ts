import { adminSupabase } from '@/lib/supabase-server';
import { AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
import { supabaseAdminPasswordLogin } from '@/lib/admin-supabase-auth.mjs';
import { clientAddress, takeQuota, rateLimitedResponse, INVALID_CREDENTIALS } from '@/lib/rate-limit.mjs';
export async function POST(request: Request) {
  const quota = takeQuota('admin-login-source', clientAddress(request), 30, 15 * 60 * 1000);
  if (!quota.allowed) return rateLimitedResponse(quota.retryAfter);
  let data: { email?: unknown; password?: unknown };
  try {
    // Bound actual streamed bytes as well as declared length, before JSON parsing.
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing credentials');
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        length += value.byteLength;
        if (length > 4096) { await reader.cancel(); throw new Error('Oversized credentials'); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return Response.json({ error: INVALID_CREDENTIALS }, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
  const result = await supabaseAdminPasswordLogin(await adminSupabase(), data);
  if (result.status === 429) return rateLimitedResponse(result.retryAfter ?? 1);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status, headers: AUTH_HEADERS });
  // A fresh admin sign-in gets a separate Supabase cookie from the customer's session.
  return Response.json({ ok: true }, { headers: AUTH_HEADERS });
}
