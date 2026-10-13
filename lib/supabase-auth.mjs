import { createServerClient } from '@supabase/ssr';
import { normalizeEmail, safeAccountReturn } from './customer-auth.mjs';
import { INVALID_CREDENTIALS, takeQuota, resetQuota } from './rate-limit.mjs';

export const SUPABASE_COOKIE = 'mlam_supabase_session';
export const SUPABASE_ADMIN_COOKIE = 'mlam_admin_supabase_session';
export const AUTH_HEADERS = { 'Cache-Control':'private, no-store, max-age=0', 'Pragma':'no-cache', 'Expires':'0' };
export const SIGNUP_NOTICE = 'If registration can proceed, check your email to confirm your account, then log in.';
export const authUnavailable = () => ({ status:503, code:'AUTH_NOT_CONFIGURED', error:'Customer sign-in is not configured yet.' });
const providerUnavailable = () => ({ status:503, code:'AUTH_UNAVAILABLE', error:'Unable to connect to the sign-in service. Please try again.' });

export function applicationOrigin(env=process.env) {
  try {
    const url=new URL(env.MLAM_ORIGIN || 'http://127.0.0.1:4180');
    const local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname!=='/' || (url.protocol!=='https:' && !(url.protocol==='http:' && local))) return null;
    return url.origin;
  } catch { return null; }
}

// Only a publishable/anon key is accepted. A privileged key must never be used
// for visitor authentication; this application does not need a service-role key.
export function supabaseConfiguration(env=process.env) {
  const value=env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key=env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const origin=applicationOrigin(env);
  if (!value || !key || !origin) return null;
  try {
    const url=new URL(value);
    const local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname!=='/' || (url.protocol!=='https:' && !(url.protocol==='http:' && local && new URL(origin).protocol==='http:'))) return null;
    let publicKey=/^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
    if (!publicKey && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
      const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString());
      publicKey=payload.role==='anon';
    }
    return publicKey ? {url:url.origin,key,origin,secure:new URL(origin).protocol==='https:'} : null;
  } catch { return null; }
}

// This is a server-only auth flow: browser JavaScript never receives tokens.
// Fresh client per request; the adapter also passes SSR's anti-cache headers on.
function createAuthClient(cookieMethods, cookieName, configuration=supabaseConfiguration()) {
  if (!configuration) return null;
  return createServerClient(configuration.url,configuration.key,{
    cookieOptions:{name:cookieName,path:'/',httpOnly:true,sameSite:'lax',secure:configuration.secure},
    cookies:cookieMethods,
    global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:init?.signal || AbortSignal.timeout(12000)})},
  });
}
export function createCustomerClient(cookieMethods, configuration=supabaseConfiguration()) {
  return createAuthClient(cookieMethods,SUPABASE_COOKIE,configuration);
}
// Admin and customer auth share the Supabase project but use isolated sessions.
export function createAdminClient(cookieMethods, configuration=supabaseConfiguration()) {
  return createAuthClient(cookieMethods,SUPABASE_ADMIN_COOKIE,configuration);
}

export async function supabasePasswordLogin(client,input) {
  if (!client) return authUnavailable();
  const email=normalizeEmail(input?.email);
  const quota=takeQuota('supabase-login-email',email || 'invalid-input',5,15*60*1000);
  if (!quota.allowed) return {status:429,retryAfter:quota.retryAfter};
  if (!email || typeof input?.password!=='string' || !input.password || input.password.length>256) return {status:401,error:INVALID_CREDENTIALS};
  try {
    const {data,error}=await client.auth.signInWithPassword({email,password:input.password});
    if (error?.status===429) return {status:429,retryAfter:60};
    if (error?.status>=500 || error?.name==='AuthRetryableFetchError') return providerUnavailable();
    if (error || !data?.user || !data?.session) return {status:401,error:INVALID_CREDENTIALS};
    resetQuota('supabase-login-email',email);
    return {status:200,ok:true};
  } catch { return providerUnavailable(); }
}

export async function supabaseSignup(client,input,next,configuration=supabaseConfiguration()) {
  if (!client || !configuration) return authUnavailable();
  const email=normalizeEmail(input?.email);
  const name=typeof input?.fullName==='string' ? input.fullName.trim() : '';
  if (!email || name.length<2 || name.length>120 || /[\u0000-\u001f\u007f]/.test(name) || typeof input?.password!=='string' || input.password.length<15 || input.password.length>256) return {status:400,error:'Check your details. Use a password of at least 15 characters.'};
  const quota=takeQuota('supabase-register-email',email,3,60*60*1000);
  if (!quota.allowed) return {status:429,retryAfter:quota.retryAfter};
  const callback=new URL('/auth/callback',configuration.origin);
  callback.searchParams.set('next',safeAccountReturn(next));
  try {
    const {data,error}=await client.auth.signUp({email,password:input.password,options:{data:{full_name:name},emailRedirectTo:callback.href}});
    // Confirmation must be enabled in Supabase. If an owner disables it,
    // signup still doesn't silently log this browser in or promote its role.
    if (data?.session) await client.auth.signOut({scope:'local'});
    if (error?.status>=500 || error?.name==='AuthRetryableFetchError') return providerUnavailable();
    if (error?.code==='weak_password' || error?.code==='validation_failed') return {status:400,error:'Check your registration details.'};
    if (error?.status===429 && error?.code!=='over_email_send_rate_limit') return {status:429,retryAfter:60};
    if (error && !['user_already_exists','email_exists','over_email_send_rate_limit'].includes(error.code)) return providerUnavailable();
    // Existing-address/provider email cooldown responses remain indistinguishable
    // from accepted registration. No local password is stored or overwritten.
    return {status:202,message:SIGNUP_NOTICE};
  } catch { return providerUnavailable(); }
}

export async function verifiedCustomer(client) {
  if (!client) return null;
  try {
    const {data,error}=await client.auth.getUser();
    const user=data?.user;
    if (error || !user?.id || !user.email) return null;
    const candidate=user.user_metadata?.full_name || user.user_metadata?.name;
    return {id:user.id,email:user.email,full_name:typeof candidate==='string' ? candidate.slice(0,120) : user.email,email_verified_at:user.email_confirmed_at || null};
  } catch { return null; }
}

export async function googleAuthorization(client,next,configuration=supabaseConfiguration()) {
  if (!client || !configuration) return authUnavailable();
  const callback=new URL('/auth/callback',configuration.origin);
  callback.searchParams.set('next',safeAccountReturn(next));
  try {
    const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.href,skipBrowserRedirect:true,scopes:'openid email profile'}});
    if (error || !data?.url) return {status:503,code:'GOOGLE_UNAVAILABLE',error:'Google sign-in is not available. Please use email/password or try again later.'};
    const url=new URL(data.url);
    if (url.origin!==configuration.url || url.pathname!=='/auth/v1/authorize' || url.searchParams.get('provider')!=='google') return providerUnavailable();
    return {status:200,url:url.href};
  } catch { return providerUnavailable(); }
}
