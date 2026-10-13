import { redirect } from 'next/navigation';
import { adminUser } from '@/lib/admin';
import AdminDashboard from './dashboard';
import { adminSection,adminLoginDestination } from '@/lib/admin-navigation';
export const dynamic = 'force-dynamic';
export default async function AdminPage({searchParams}:{searchParams:Promise<{section?:string}>}) {
  const section=adminSection((await searchParams).section);
  const user = await adminUser();
  if (!user) redirect(adminLoginDestination(section));
  return <AdminDashboard user={user.displayName} signOut="/admin/logout" initialSection={section}/>;
}
