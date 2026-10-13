'use client';
import { useState, type FormEvent } from 'react';
export default function LoginForm({destination='/admin'}:{destination?:string}) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const element = event.currentTarget; const form = new FormData(element);
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) });
      const data = await response.json(); element.reset();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in');
      window.location.assign(destination);
    } catch (err) { setError(err instanceof Error ? err.message : 'Connection failed'); } finally { setBusy(false); }
  }
  return <form className="admin-form" onSubmit={submit}>
    <label>Administrator email<input name="email" type="email" autoComplete="username" inputMode="email" maxLength={254} required disabled={busy} placeholder="you@example.com"/></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} disabled={busy} placeholder="Enter your password"/></label>
    <button className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to dashboard'}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
