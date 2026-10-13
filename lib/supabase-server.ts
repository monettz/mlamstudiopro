import 'server-only';
import { cookies } from 'next/headers';
import { createAdminClient, createCustomerClient, AUTH_HEADERS, type AuthOutcome } from './supabase-auth.mjs';
import { rateLimitedResponse } from './rate-limit.mjs';

async function requestSupabase(createClient:typeof createCustomerClient) {
  const jar=await cookies();
  return createClient({
    getAll:()=>jar.getAll(),
    setAll:values=>{
      try { for (const {name,value,options} of values) jar.set(name,value,options); }
      catch { /* Server Components cannot write cookies; proxy refreshes them. */ }
    },
  });
}
export async function customerSupabase() { return requestSupabase(createCustomerClient); }
export async function adminSupabase() { return requestSupabase(createAdminClient); }
export function authResponse(result:AuthOutcome) {
  if (result.status===429) return rateLimitedResponse(result.retryAfter || 60);
  return Response.json({ok:result.ok,message:result.message,error:result.error,code:result.code,url:result.url},{status:result.status,headers:AUTH_HEADERS});
}
