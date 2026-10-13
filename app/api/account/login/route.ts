import { supabasePasswordLogin, AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
import { customerSupabase,authResponse } from '@/lib/supabase-server';
import { clientAddress, takeQuota, rateLimitedResponse, INVALID_CREDENTIALS } from '@/lib/rate-limit.mjs';
import { boundedJson } from '@/lib/bounded-json';
export async function POST(request:Request) {
  const quota=takeQuota('customer-login-source',clientAddress(request),30,15*60*1000);
  if(!quota.allowed)return rateLimitedResponse(quota.retryAfter);
  let input;try{input=await boundedJson(request);}catch{return Response.json({error:INVALID_CREDENTIALS},{status:400,headers:AUTH_HEADERS});}
  return authResponse(await supabasePasswordLogin(await customerSupabase(),input));
}
