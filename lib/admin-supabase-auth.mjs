import { normalizeEmail } from './customer-auth.mjs';
import { INVALID_CREDENTIALS, TOO_MANY_ATTEMPTS, takeQuota, resetQuota } from './rate-limit.mjs';

const providerUnavailable = () => ({status:503,code:'ADMIN_AUTH_UNAVAILABLE',error:'Admin sign-in is unavailable. Please try again later.'});

export function configuredAdminEmail(env=process.env) {
  return normalizeEmail(env.MLAM_ADMIN_EMAIL);
}

// Admin rights come only from a server-configured email and a verified Supabase
// identity. Editable user metadata (including a claimed "admin" role) is ignored.
export function isAuthorizedAdmin(user, allowedEmail) {
  const expected=normalizeEmail(allowedEmail);
  return !!expected && !!(user?.email_verified_at || user?.email_confirmed_at) && normalizeEmail(user.email)===expected;
}

export async function supabaseAdminPasswordLogin(client,input,allowedEmail=configuredAdminEmail()) {
  const expected=normalizeEmail(allowedEmail);
  if(!client || !expected) return {status:503,code:'ADMIN_AUTH_NOT_CONFIGURED',error:'Admin sign-in is not configured on this server yet.'};

  const email=normalizeEmail(input?.email);
  const quota=takeQuota('admin-supabase-login-email',email || 'invalid-input',5,15*60*1000);
  if(!quota.allowed) return {status:429,error:TOO_MANY_ATTEMPTS,retryAfter:quota.retryAfter};
  if(!email || typeof input?.password!=='string' || !input.password || input.password.length>256 || email!==expected) return {status:401,error:INVALID_CREDENTIALS};

  try {
    const {data,error}=await client.auth.signInWithPassword({email,password:input.password});
    if(error?.status===429) return {status:429,error:TOO_MANY_ATTEMPTS,retryAfter:60};
    if(error?.status>=500 || error?.name==='AuthRetryableFetchError') return providerUnavailable();
    if(error || !data?.user || !data?.session || !isAuthorizedAdmin(data.user,expected)) {
      if(data?.session) { try { await client.auth.signOut({scope:'local'}); } catch { /* Deny even if cookie cleanup fails. */ } }
      return {status:401,error:INVALID_CREDENTIALS};
    }
    resetQuota('admin-supabase-login-email',email);
    return {status:200,ok:true};
  } catch { return providerUnavailable(); }
}
