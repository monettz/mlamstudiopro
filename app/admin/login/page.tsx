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
    <main className="auth-exact-split-page admin-login-page" dir="ltr">
      <a className="admin-login-return" href="/">← Back to MLAM Studio Pro</a>

      <aside className="auth-exact-photo-column" aria-hidden="true">
        <div className="auth-exact-halo" />
        <img src="/images/auth/auth-hero-logo.png" alt="" className="auth-exact-photo-img" loading="eager" />
      </aside>

      <div className="auth-exact-form-column">
        <span className="auth-exact-brand-kicker"><i aria-hidden="true" />OWNER CONTROL ROOM</span>
        <h1 id="admin-login-title" className="auth-exact-heading">Admin sign in</h1>

        <section className="auth-exact-card admin-auth-card" aria-labelledby="admin-login-title">
          <h2 className="auth-exact-card-title">Welcome back</h2>
          <p className="admin-subtitle">Manage your MLAM Studio Pro store, releases and tutorials.</p>

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
        </section>

        <p className="auth-exact-bottom-text">Not the owner? <a href="/account/login" className="auth-exact-switch-link">Customer login</a></p>
      </div>
    </main>
  );
}
