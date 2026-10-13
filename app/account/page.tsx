import { redirect } from 'next/navigation';
import { customerUser } from '@/lib/customer';
import AccountPanel from './panel';
export const dynamic='force-dynamic';
export default async function AccountPage() {
  const user=await customerUser();if(!user)redirect('/account/login');
  return <AccountPanel name={user.full_name} email={user.email} verified={!!user.email_verified_at}/>;
}
