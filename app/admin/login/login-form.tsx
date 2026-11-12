'use client';
import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export default function LoginForm({destination='/admin',devMode=false}:{destination?:string;devMode?:boolean}) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const element = event.currentTarget; const form = new FormData(element);
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        const minutes = Math.max(1, Math.ceil((Number.isFinite(seconds) && seconds > 0 ? seconds : 60) / 60));
        throw new Error(`Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
      }
      const data = await response.json().catch(() => ({})) as { error?: string };
      // Keep the email after a failed attempt; only the password is cleared.
      const password = element.elements.namedItem('password');
      if (password instanceof HTMLInputElement) password.value = '';
      if (!response.ok) throw new Error(data.error || 'Unable to sign in');
      window.location.assign(destination);
    } catch (err) {
      setError(err instanceof TypeError ? 'Could not reach the server. Check your connection and try again.' : err instanceof Error ? err.message : 'Connection failed');
      setBusy(false);
    }
  }
  return <form className="admin-form admin-login-form" onSubmit={submit} noValidate={false}>
    <label htmlFor="admin-email">Administrator email</label>
    <input id="admin-email" name="email" type={devMode ? 'text' : 'email'} autoComplete="username" inputMode="email" maxLength={254} required disabled={busy} placeholder="you@example.com" aria-invalid={!!error || undefined} aria-describedby={error ? 'admin-login-error' : undefined}/>
    <label htmlFor="admin-password">Password</label>
    <div className="admin-password-field">
      <input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={256} disabled={busy} placeholder="Enter your password" aria-invalid={!!error || undefined} aria-describedby={error ? 'admin-login-error' : undefined}/>
      <button type="button" className="admin-password-toggle" aria-controls="admin-password" aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)}>
        {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
      </button>
    </div>
    {error && <p id="admin-login-error" className="admin-login-error" role="alert">{error}</p>}
    <button className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to dashboard'}</button>
  </form>;
}
