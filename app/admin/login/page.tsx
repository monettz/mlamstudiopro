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
  return (
    <main className="admin-login-page" dir="ltr">
      <a className="brand access-brand" href="/">
        <img src="/mlam-mark-3d-green-512.png" alt="MLAM Studio Pro" />
        <span><b>MLAM</b> STUDIO PRO<small>Owner Control Room</small></span>
      </a>
      <section className="admin-auth-card" aria-labelledby="admin-login-title">
        <div className="admin-card-header">
          <span className="showcase-kicker">SECURE OWNER ACCESS</span>
          <h1 id="admin-login-title" className="admin-title">Admin sign in</h1>
          <p className="admin-subtitle">Sign in to manage your MLAM Studio Pro store, releases & tutorials.</p>
        </div>

        <LoginForm destination={adminDestination(section)} />

        {!ownerReady && (
          <div className="admin-setup-hint" role="status">
            <strong>Supabase Admin access needs configuration.</strong>
            <span>Set the private server variable <code>MLAM_ADMIN_EMAIL</code> to the confirmed Supabase account email allowed to manage this website. Public admin sign-up is disabled.</span>
          </div>
        )}

        <a className="admin-back-link" href="/">← Return to MLAM Studio Pro</a>
      </section>
    </main>
  );
}
