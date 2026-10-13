import { cookies } from 'next/headers';
import { adminSupabase } from '@/lib/supabase-server';
import { SUPABASE_ADMIN_COOKIE, AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
export async function POST() {
  const client=await adminSupabase();
  if(client) { try { await client.auth.signOut({scope:'local'}); } catch { /* Always clear the local Admin session. */ } }
  const jar=await cookies();
  for(const cookie of jar.getAll()) if(cookie.name===SUPABASE_ADMIN_COOKIE || cookie.name.startsWith(`${SUPABASE_ADMIN_COOKIE}.`) || cookie.name.startsWith(`${SUPABASE_ADMIN_COOKIE}-`)) jar.delete(cookie.name);
  return Response.json({ ok: true }, { headers: AUTH_HEADERS });
}
