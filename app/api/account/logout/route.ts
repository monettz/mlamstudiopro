import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE,revokeCustomerSession } from '@/lib/customer-auth.mjs';
import { customerSupabase } from '@/lib/supabase-server';
import { SUPABASE_COOKIE,AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
export async function POST() {
  const client=await customerSupabase();
  if (client) { try { await client.auth.signOut({scope:'local'}); } catch { /* Always clear this browser's cookies. */ } }
  const jar=await cookies();revokeCustomerSession(jar.get(CUSTOMER_COOKIE)?.value);jar.delete(CUSTOMER_COOKIE);
  for (const cookie of jar.getAll()) if (cookie.name===SUPABASE_COOKIE || cookie.name.startsWith(`${SUPABASE_COOKIE}.`) || cookie.name.startsWith(`${SUPABASE_COOKIE}-`)) jar.delete(cookie.name);
  return Response.json({ok:true},{headers:AUTH_HEADERS});
}
