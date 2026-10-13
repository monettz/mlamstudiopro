import { redirect } from 'next/navigation';
import { customerUser } from '@/lib/customer';
import { safeAccountReturn } from '@/lib/customer-auth.mjs';
import CustomerAuthForm from '../auth-form';
import { supabaseConfiguration } from '@/lib/supabase-auth.mjs';
export const dynamic='force-dynamic';
export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}) {
  const params=await searchParams;
  const next=safeAccountReturn(params.next);
  if(await customerUser())redirect(next);
  return <CustomerAuthForm mode="login" next={next} configured={!!supabaseConfiguration()} callbackFailed={params.error==='auth'}/>;
}
