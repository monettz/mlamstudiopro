import { redirect } from 'next/navigation';
import { adminUser } from '@/lib/admin';
import { configuredAdminEmail } from '@/lib/admin-supabase-auth.mjs';
import { supabaseConfiguration } from '@/lib/supabase-auth.mjs';
import LoginForm from './login-form';
import { adminDestination,adminSection } from '@/lib/admin-navigation';
export const dynamic = 'force-dynamic';
export default async function LoginPage({searchParams}:{searchParams:Promise<{section?:string}>}) {
  const section=adminSection((await searchParams).section);const ownerReady=!!supabaseConfiguration()&&!!configuredAdminEmail();
  if (await adminUser()) redirect(adminDestination(section));
  return <main className="admin-login" dir="ltr">
    <a className="brand" href="/"><img src="/mlam-mark-3d-green.png" alt=""/><span><b>MLAM</b> STUDIO PRO<small>ADMINISTRATION</small></span></a>
    <section className="admin-card admin-auth-card" aria-labelledby="admin-login-title">
      <div className="admin-auth-icon" aria-hidden="true">M</div>
      <span className="kicker">SECURE OWNER ACCESS</span>
      <h1 id="admin-login-title">Admin sign in</h1>
      <p>Sign in to manage your MLAM Studio Pro website.</p>
      <LoginForm destination={adminDestination(section)}/>
      {!ownerReady&&<div className="admin-setup-hint" role="status"><strong>Supabase Admin access needs configuration.</strong><span>Set the private server variable <code>MLAM_ADMIN_EMAIL</code> to the confirmed Supabase account email allowed to manage this website. Public admin sign-up is disabled.</span></div>}
      <a className="details" href="/">← Back to MLAM Studio Pro</a>
    </section>
  </main>;
}
