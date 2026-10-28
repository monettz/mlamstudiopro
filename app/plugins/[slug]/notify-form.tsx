'use client';
import { FormEvent, useState } from 'react';

export default function NotifyForm({ productId, productName }: { productId: string; productName: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('sending'); setError('');
    try {
      const response = await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, email }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Something went wrong. Please try again.');
      setState('done');
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); setState('idle'); }
  }

  if (state === 'done') return <p className="notify-done" role="status">Thanks! We will email you when {productName} launches.</p>;
  return (
    <form className="notify-form" onSubmit={submit}>
      <label htmlFor="notify-email">Get an email when it launches</label>
      <div className="notify-row">
        <input id="notify-email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
        <button className="notify-btn" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Notify me'}</button>
      </div>
      {error && <p className="notify-error" role="alert">{error}</p>}
    </form>
  );
}
