import { NextResponse } from 'next/server';
import { customerSupabase } from '@/lib/supabase-server';
import { safeAccountReturn } from '@/lib/customer-auth.mjs';
import { applicationOrigin,AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
// Optional Supabase confirmation email template: supports opening on a different
// device without relying on the original browser's PKCE verifier cookie.
export async function GET(request:Request) {
  const url=new URL(request.url);const origin=applicationOrigin();
  if (!origin) return new Response('Authentication is not configured.',{status:503,headers:AUTH_HEADERS});
  const next=safeAccountReturn(url.searchParams.get('next'));
  const hash=url.searchParams.get('token_hash');const client=await customerSupabase();
  if (client && url.searchParams.get('type')==='email' && hash && hash.length<=2048) {
    try {
      const {error}=await client.auth.verifyOtp({token_hash:hash,type:'email'});
      if (!error) return NextResponse.redirect(new URL(next,origin),{status:303,headers:{...AUTH_HEADERS,'Referrer-Policy':'no-referrer'}});
    } catch { /* No token or provider details in errors. */ }
  }
  const target=new URL('/account/login',origin);target.searchParams.set('error','auth');target.searchParams.set('next',next);
  return NextResponse.redirect(target,{status:303,headers:{...AUTH_HEADERS,'Referrer-Policy':'no-referrer'}});
}
