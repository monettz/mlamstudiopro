import { redirect } from 'next/navigation';
import { adminUser } from '@/lib/admin';
import { configuredAdminEmail } from '@/lib/admin-supabase-auth.mjs';
import { supabaseConfiguration } from '@/lib/supabase-auth.mjs';
import LoginForm from './login-form';
import { devAdminEnabled } from '@/lib/dev-admin';
import { adminDestination,adminSection } from '@/lib/admin-navigation';
export const dynamic = 'force-dynamic';
export default async function LoginPage({searchParams}:{searchParams:Promise<{section?:string}>}) {
  const section=adminSection((await searchParams).section);const ownerReady=!!supabaseConfiguration()&&!!configuredAdminEmail();
  const devMode=devAdminEnabled();
  if (await adminUser()) redirect(adminDestination(section));
  return (
    <main className="admin-login-page" dir="ltr">
      <a className="brand access-brand" href="/">
        <img src="/mlam-mark-3d-green-512.png" alt="MLAM Studio Pro" />
        <span><b>MLAM</b> STUDIO PRO<small>Owner Control Room</small></span>
      </a>
      <section className="admin-auth-card" aria-labelledby="admin-login-title">
        <div className="admin-card-header">
          <h1 id="admin-login-title" className="admin-title">Admin sign in</h1>
          <p className="admin-subtitle">Sign in to manage your MLAM Studio Pro store, releases & tutorials.</p>
        </div>

        <LoginForm destination={adminDestination(section)} devMode={devMode} />

        {devMode && (
          <div className="admin-dev-hint" role="status">
            <strong>Local test sign-in is on.</strong>
            <span>Any email and password work on this computer only. It is off in production builds.</span>
          </div>
        )}

        {!ownerReady && !devMode && (
          <div className="admin-setup-hint" role="status">
            {/* Setup details (environment variable names) live in README, not on this public page. */}
            <strong>Owner sign-in is not set up yet.</strong>
            <span>Finish the owner setup on the server, then sign in here.</span>
          </div>
        )}

        <a className="admin-back-link" href="/">← Return to MLAM Studio Pro</a>
      </section>
    </main>
  );
}
