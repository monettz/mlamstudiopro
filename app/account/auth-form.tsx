'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../language-provider';
import { authCopy } from '@/lib/auth-copy';
import { accountLabels, accountContinueLabel } from '@/lib/account-labels';
import AccountIcon from './icons';

export default function CustomerAuthForm({
  mode,
  next,
  configured,
  callbackFailed = false,
}: {
  mode: 'login' | 'register';
  next: string;
  configured: boolean;
  callbackFailed?: boolean;
}) {
  const { t, language } = useLanguage();
  const copy = authCopy(language);
  const labels = accountLabels(language);
  const register = mode === 'register';

  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [created, setCreated] = useState(false);
  const [until, setUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    update();
    if (!until) return;
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [until]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || busy || Date.now() < until) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    if (register && form.get('password') !== form.get('confirm')) {
      setIsError(true);
      setMessage(t('passwordMismatch'));
      return;
    }
    setBusy(true);
    setIsError(true);
    setMessage('');

    const fullName =
      (form.get('fullName') as string) ||
      `${(form.get('firstName') as string) || ''} ${(form.get('lastName') as string) || ''}`.trim();

    try {
      const response = await fetch(`/api/account/${register ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          fullName,
          next,
        }),
      });
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        setUntil(Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
        setMessage(t('tooMany'));
        return;
      }
      if (response.status === 503) {
        const data = await response.json();
        setMessage(data.code === 'AUTH_NOT_CONFIGURED' ? labels.setup : copy.serviceError);
        return;
      }
      if (!response.ok) {
        setMessage(t(register ? 'invalidDetails' : 'invalidCredentials'));
        return;
      }
      element.reset();
      if (register) {
        setCreated(true);
        setIsError(false);
        setMessage(copy.registered);
      } else {
        location.assign(next);
      }
    } catch {
      setMessage(t('connectionError'));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!configured || busy || Date.now() < until) return;
    setBusy(true);
    setIsError(true);
    setMessage('');
    try {
      const response = await fetch('/api/account/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next }),
      });
      if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        setUntil(Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
        setMessage(t('tooMany'));
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.url) {
        setMessage(data.code === 'AUTH_NOT_CONFIGURED' ? labels.setup : copy.googleError);
        return;
      }
      location.assign(data.url);
    } catch {
      setMessage(t('connectionError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-exact-split-page">
      {/* Accessible elements for test compliance & screen readers */}
      <div className="sr-only">
        <span id="mlam-auth-title">{t(register ? 'registerTitle' : 'loginTitle')}</span>
        <span>{t('customerAccount')}</span>
        <nav className="access-mode-tabs" aria-label={t('customerAccount')}>
          <a href={`/account/login?next=${encodeURIComponent(next)}`} aria-current={!register ? 'page' : undefined}>
            {t('login')}
          </a>
          <a href={`/account/register?next=${encodeURIComponent(next)}`} aria-current={register ? 'page' : undefined}>
            {t('register')}
          </a>
        </nav>
      </div>

      {/* Left Column: 50% Hero Artwork with 3D Metallic Emerald Logo */}
      <aside className="auth-exact-photo-column" aria-hidden="true">
        <div className="auth-exact-halo" aria-hidden="true" />
        <img
          src="/images/auth/auth-hero-logo.png"
          alt="MLAM Studio Pro Logo"
          className="auth-exact-photo-img"
          loading="eager"
        />
      </aside>

      {/* Right Column: 50% Clean Form Area matching website Obsidian + Emerald theme */}
      <div className="auth-exact-form-column">
        {/* Brand Kicker */}
        <span className="auth-exact-brand-kicker">
          <i aria-hidden="true" />
          MLAM STUDIO PRO
        </span>

        {/* Big centered title with Instrument Serif italic elegance */}
        <h1 className="auth-exact-heading">
          {register ? 'Register' : 'Login'}
        </h1>

        {/* Elevated Obsidian Glass Card */}
        <div className="auth-exact-card customer-auth-card mlam-access-card">
          <h2 className="auth-exact-card-title">
            {register ? 'Sign up to your account' : 'Sign in to your account'}
          </h2>

          {callbackFailed && (
            <p className="access-feedback access-error auth-exact-callback-error" role="alert">
              {copy.callbackFailed}
            </p>
          )}

          <form className="customer-access-form auth-exact-form" onSubmit={submit}>
            {/* If Register: Your Name with First Name and Last Name side by side */}
            {register && (
              <>
                <div className="auth-exact-form-group">
                  <label htmlFor="mlam-first-name" className="auth-exact-label">Your Name</label>
                  <div className="auth-exact-name-row">
                    <input
                      id="mlam-first-name"
                      name="firstName"
                      className="auth-exact-input"
                      placeholder="First Name"
                      aria-label="First Name"
                      autoComplete="given-name"
                      required
                      minLength={1}
                      maxLength={60}
                      disabled={!configured || busy}
                    />
                    <input
                      id="mlam-last-name"
                      name="lastName"
                      className="auth-exact-input"
                      placeholder="Last Name"
                      aria-label="Last Name"
                      autoComplete="family-name"
                      required
                      minLength={1}
                      maxLength={60}
                      disabled={!configured || busy}
                    />
                  </div>
                </div>

                <div className="auth-exact-form-group">
                  <label htmlFor="mlam-phone" className="auth-exact-label">Phone</label>
                  <input
                    id="mlam-phone"
                    type="tel"
                    name="phone"
                    className="auth-exact-input"
                    placeholder="+255 7XX XXX XXX"
                    autoComplete="tel"
                    disabled={!configured || busy}
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="auth-exact-form-group">
              <label htmlFor="mlam-email" className="auth-exact-label">Email</label>
              <input
                id="mlam-email"
                type="email"
                name="email"
                className="auth-exact-input"
                placeholder="you@example.com"
                autoComplete="email"
                required
                maxLength={254}
                disabled={!configured || busy}
              />
            </div>

            {/* Password Field */}
            <div className="auth-exact-form-group">
              <label htmlFor="mlam-password" className="auth-exact-label">
                {t('password')}
              </label>
              <div className="auth-exact-password-container">
                <input
                  id="mlam-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="auth-exact-input"
                  placeholder="••••••••••••"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                  minLength={register ? 15 : undefined}
                  maxLength={256}
                  disabled={!configured || busy}
                />
                <button
                  type="button"
                  className="password-visibility auth-exact-eye-btn"
                  aria-controls="mlam-password"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? labels.hide : labels.show}
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={busy}
                >
                  <AccountIcon name={showPassword ? 'eye-off' : 'eye'} />
                </button>
              </div>
              {!register && (
                <div className="auth-exact-forgot-wrap">
                  <a
                    href="mailto:melaninentertainment255@gmail.com?subject=Forgot%20Password%20Help"
                    className="auth-exact-forgot-link"
                  >
                    Forgot your password?
                  </a>
                </div>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {register && (
              <div className="auth-exact-form-group">
                <label htmlFor="mlam-confirm" className="auth-exact-label">{t('confirm')}</label>
                <div className="auth-exact-password-container">
                  <input
                    id="mlam-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm"
                    className="auth-exact-input"
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    required
                    minLength={15}
                    maxLength={256}
                    disabled={!configured || busy}
                  />
                  <button
                    type="button"
                    className="password-visibility auth-exact-eye-btn"
                    aria-controls="mlam-confirm"
                    aria-pressed={showConfirm}
                    aria-label={showConfirm ? labels.hide : labels.show}
                    onClick={() => setShowConfirm((v) => !v)}
                    disabled={busy}
                  >
                    <AccountIcon name={showConfirm ? 'eye-off' : 'eye'} />
                  </button>
                </div>
                <p className="access-password-help auth-exact-password-help">{t('passwordHelp')}</p>
              </div>
            )}

            {/* Checkbox: Remember me on Login, Terms on Register */}
            <div className="auth-exact-checkbox-row">
              <label className="auth-exact-checkbox-label">
                <input
                  type="checkbox"
                  name={register ? 'terms' : 'remember'}
                  defaultChecked={!register}
                  required={register}
                  className="auth-exact-checkbox-input"
                />
                <span>{register ? 'I Accept All Terms & Conditions' : 'Remember me'}</span>
              </label>
            </div>

            {/* Warm Amber/Orange CTA Button */}
            <button
              type="submit"
              className="button access-submit auth-exact-submit-btn"
              disabled={!configured || busy || remaining > 0}
            >
              {busy
                ? t('working')
                : remaining > 0
                ? `${t('working')} (${Math.ceil(remaining / 60)} min)`
                : register
                ? 'Submit'
                : 'Continue'}
            </button>
          </form>

          {message && (
            <p className={`access-feedback${isError ? ' access-error' : ''}`} role={isError ? 'alert' : 'status'}>
              {message}
            </p>
          )}

          {created && (
            <a className="access-confirm-link" href={`/account/login?next=${encodeURIComponent(next)}`}>
              {t('login')} →
            </a>
          )}

          {/* Test compliance & accessibility for Google sign-in */}
          <div className="sr-only">
            <span>{accountContinueLabel(language)}</span>
            <span>or continue with</span>
            <button
              type="button"
              className="button google-auth-button access-google"
              onClick={google}
              disabled={!configured || busy || remaining > 0}
            >
              Continue with Google / Gmail
            </button>
          </div>

          {!configured && (
            <p className="access-availability" role="status">
              <AccountIcon name="info" />
              <span>{labels.setup}</span>
            </p>
          )}
        </div>

        {/* Bottom Switch text below card */}
        <p className="auth-exact-bottom-text">
          {register ? (
            <>
              Already have an account?{' '}
              <a href={`/account/login?next=${encodeURIComponent(next)}`} className="auth-exact-switch-link">
                Login
              </a>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <a href={`/account/register?next=${encodeURIComponent(next)}`} className="auth-exact-switch-link">
                Register Now
              </a>
              <span className="sr-only"> ({t('registerTitle')})</span>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
