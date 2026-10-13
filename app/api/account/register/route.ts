import { supabaseSignup, AUTH_HEADERS } from '@/lib/supabase-auth.mjs';
import { customerSupabase,authResponse } from '@/lib/supabase-server';
import { clientAddress,takeQuota,rateLimitedResponse } from '@/lib/rate-limit.mjs';
import { boundedJson } from '@/lib/bounded-json';
export async function POST(request:Request) {
  const quota=takeQuota('customer-register-source',clientAddress(request),10,60*60*1000);
  if(!quota.allowed)return rateLimitedResponse(quota.retryAfter);
  let input;try{input=await boundedJson(request);}catch{return Response.json({error:'Check your registration details.'},{status:400,headers:AUTH_HEADERS});}
  const next=input && typeof input==='object' && 'next' in input ? input.next : null;
  return authResponse(await supabaseSignup(await customerSupabase(),input,next));
}
