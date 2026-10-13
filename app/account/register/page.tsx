import { redirect } from 'next/navigation';
import { customerUser } from '@/lib/customer';
import { safeAccountReturn } from '@/lib/customer-auth.mjs';
import CustomerAuthForm from '../auth-form';
import { supabaseConfiguration } from '@/lib/supabase-auth.mjs';
export const dynamic='force-dynamic';
export default async function RegisterPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
  if(await customerUser())redirect('/account');
  return <CustomerAuthForm mode="register" next={safeAccountReturn((await searchParams).next)} configured={!!supabaseConfiguration()}/>;
}
