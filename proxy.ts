import { NextRequest, NextResponse } from 'next/server';
import { trustedOrigin } from './lib/request-origin.mjs';
import { createAdminClient,createCustomerClient,SUPABASE_ADMIN_COOKIE,SUPABASE_COOKIE,AUTH_HEADERS } from './lib/supabase-auth.mjs';
export async function proxy(request: NextRequest) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !trustedOrigin(request)) return NextResponse.json({ error: 'Same-origin request required' }, { status: 403 });
  let response=NextResponse.next({request});
  const path=request.nextUrl.pathname;
  const adminRoute=path.startsWith('/admin') || path.startsWith('/api/admin/');
  const customerRoute=path.startsWith('/account') || path.startsWith('/auth/') || path.startsWith('/api/account/');
  if (!customerRoute && !adminRoute) return response;
  for (const [key,value] of Object.entries(AUTH_HEADERS)) response.headers.set(key,value);
  // Refresh only the relevant existing session, never OAuth verifier-only cookies.
  // Customer and Admin cookies are isolated; customer metadata never grants Admin.
  const cookieName=adminRoute?SUPABASE_ADMIN_COOKIE:SUPABASE_COOKIE;
  if (!request.cookies.getAll().some(cookie=>cookie.name===cookieName || cookie.name.startsWith(`${cookieName}.`) || cookie.name.startsWith(`${cookieName}-`))) return response;
  const createClient=adminRoute?createAdminClient:createCustomerClient;
  const client=createClient({getAll:()=>request.cookies.getAll(),setAll:(values,headers)=>{
    for (const {name,value} of values) request.cookies.set(name,value);
    const replacement=NextResponse.next({request});
    // Preserve every chunk/deletion if the client writes more than once.
    for (const cookie of response.cookies.getAll()) replacement.cookies.set(cookie);
    response=replacement;
    for (const {name,value,options} of values) response.cookies.set(name,value,options);
    for (const [key,value] of Object.entries({...AUTH_HEADERS,...headers})) response.headers.set(key,value);
  }});
  if (client) { try { await client.auth.getUser(); } catch { /* Routes fail closed. */ } }
  return response;
}
export const config = { matcher: ['/api/:path*','/account/:path*','/auth/:path*','/admin/:path*'] };
