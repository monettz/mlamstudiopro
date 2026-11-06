import { adminSupabase } from './supabase-server';
import { verifiedCustomer } from './supabase-auth.mjs';
import { configuredAdminEmail, isAuthorizedAdmin } from './admin-supabase-auth.mjs';
import { takeQuota, rateLimitedResponse } from './rate-limit.mjs';
import { cookies } from 'next/headers';
import { DEV_ADMIN_COOKIE, devAdminEnabled, readDevAdminSession } from './dev-admin';
export async function adminUser() {
  // Local test sign-in (development only, opt-in); see lib/dev-admin.ts.
  if (devAdminEnabled()) {
    const devUser = readDevAdminSession((await cookies()).get(DEV_ADMIN_COOKIE)?.value);
    if (devUser) return devUser;
  }
  const allowedEmail=configuredAdminEmail();
  if(!allowedEmail) return null;
  const user=await verifiedCustomer(await adminSupabase());
  if(!user || !isAuthorizedAdmin(user,allowedEmail)) return null;
  return { userId:user.id, email:user.email, displayName:user.email };
}
export async function rejectUnlessAdmin() {
  const user = await adminUser();
  if (!user) return Response.json({ error: 'Admin sign-in required' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  // One budget per authenticated account, not per token: creating a second
  // session or switching endpoints cannot bypass the same user's limit.
  const quota = takeQuota('admin-protected-api', user.userId, 120, 60 * 1000);
  return quota.allowed ? null : rateLimitedResponse(quota.retryAfter);
}
