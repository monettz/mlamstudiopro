import { NextResponse } from 'next/server';
import { customerSupabase } from '@/lib/supabase-server';
import { safeAccountReturn } from '@/lib/customer-auth.mjs';
import { applicationOrigin, AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
export async function GET(request:Request) {
  const url=new URL(request.url);
  const next=safeAccountReturn(url.searchParams.get('next'));
  const origin=applicationOrigin();
  if (!origin) return new Response('Authentication is not configured.',{status:503,headers:AUTH_HEADERS});
  const code=url.searchParams.get('code');
  const client=await customerSupabase();
  if (code && code.length<=2048 && !url.searchParams.has('error') && client) {
    try {
      const {error}=await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next,origin),{status:303,headers:{...AUTH_HEADERS,'Referrer-Policy':'no-referrer'}});
    } catch { /* Never echo an authorization code or provider error. */ }
  }
  const target=new URL('/account/login',origin);
  target.searchParams.set('next',next);target.searchParams.set('error','auth');
  return NextResponse.redirect(target,{status:303,headers:{...AUTH_HEADERS,'Referrer-Policy':'no-referrer'}});
}
