'use client';
import { useEffect, useState, type FormEvent } from 'react';
export default function CheckoutForm({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [limitedUntil, setLimitedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((limitedUntil - Date.now()) / 1000)));
    update(); if (!limitedUntil) return;
    const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [limitedUntil]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || Date.now() < limitedUntil) return;
    const data = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/checkout/prepare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, email: data.get('email'), fullName: data.get('fullName'), paymentMethod: data.get('paymentMethod') }) });
      const result = await response.json();
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        setLimitedUntil(Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
      }
      setMessage(result.error || 'Checkout is not available yet. No payment was taken.');
    } catch { setMessage('Unable to connect. No payment was started. Please try again.'); }
    finally { setBusy(false); }
  }
  return <form className="checkout-details" onSubmit={submit}>
    <h2>Customer details</h2><p className="checkout-form-notice">Preview only. Payments are not live yet. This form does not create an account, verify your email or save your contact details.</p>
    <label htmlFor="checkout-name">Full name<input id="checkout-name" name="fullName" autoComplete="name" minLength={2} maxLength={120} required disabled={busy}/></label>
    <label htmlFor="checkout-email">Email address<input id="checkout-email" name="email" type="email" autoComplete="email" maxLength={254} required disabled={busy}/></label>
    <label htmlFor="checkout-method">Preferred payment method<select id="checkout-method" name="paymentMethod" required disabled={busy}><option value="">Choose a method — coming soon</option><option value="mpesa">M-Pesa — not active yet</option><option value="card">Visa / Mastercard — not active yet</option></select></label>
    <p className="checkout-form-notice">Do not enter card numbers, PINs or passwords here.</p>
    <button className="button primary" disabled={busy || remaining > 0}>{busy ? 'Checking details…' : remaining > 0 ? `Please wait ${Math.ceil(remaining / 60)} min` : 'Check details — preview only'}</button>
    {message && <p className="download-message" role="status" aria-live="polite">{message}{remaining > 0 && <> Try again in {Math.ceil(remaining / 60)} minute(s).</>}</p>}
    <small>Protected by server-side request limits.</small>
  </form>;
}
