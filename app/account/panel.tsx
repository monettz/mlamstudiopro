'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../language-provider';
import { authCopy } from '@/lib/auth-copy';
import { accountLabels } from '@/lib/account-labels';
import AccountIcon from './icons';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';
import type { CustomerLicenseItem, CustomerOrderItem } from './page';

interface AccountPanelProps {
  name: string;
  email: string;
  verified: boolean;
  licenses?: CustomerLicenseItem[];
  orders?: CustomerOrderItem[];
}

export default function AccountPanel({
  name,
  email,
  verified,
  licenses = [],
  orders = [],
}: AccountPanelProps) {
  const { t, language } = useLanguage();
  const copy = authCopy(language);
  const labels = accountLabels(language);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/account/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      location.assign('/account/login');
    } catch {
      setError(t('connectionError'));
      setBusy(false);
    }
  }

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = key;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  }

  function toggleReveal(id: string) {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function downloadLicenseRelease(lic: CustomerLicenseItem) {
    setDownloadingId(lic.id);
    setDownloadStatus(null);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: lic.license_key }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || 'Download limit reached or release unavailable.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]
        || lic.release_file_name
        || `${lic.product_slug || 'mlam'}-vst3.zip`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setDownloadStatus({
        message: `✓ Download started for ${lic.product_name || 'plugin'}. Check your browser downloads!`,
        type: 'success',
      });
    } catch (err) {
      setDownloadStatus({
        message: err instanceof Error ? err.message : 'Unable to initiate download.',
        type: 'error',
      });
    } finally {
      setDownloadingId(null);
    }
  }

  function formatBytes(bytes: number | null | undefined) {
    if (!bytes) return 'VST3 Installer';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  function maskKey(key: string) {
    const parts = key.split('-');
    if (parts.length < 5) return key;
    return `${parts[0]}-${parts[1]}-•••••-•••••-${parts[4]}`;
  }

  return (
    <div className="subpage-wrapper">
      <ModernNav activeTab="account" />
      <main className="mlam-account-page">
        <div className="account-dashboard">
          {/* Sidebar */}
          <aside className="customer-account-sidebar">
            <Link className="brand access-brand" href="/" dir="ltr">
              <img src="/mlam-mark-3d-green-512.png" alt="" />
              <span>
                <b>MLAM</b> STUDIO PRO
                <small>CUSTOMER HUB</small>
              </span>
            </Link>

            <div className="customer-profile">
              <span className="customer-avatar" aria-hidden="true">
                {Array.from(name.trim())[0]?.toUpperCase() || 'M'}
              </span>
              <strong>{name}</strong>
              <span className="customer-email" dir="ltr">{email}</span>
              {verified && (
                <span className="customer-sidebar-verified">
                  <AccountIcon name="check" />
                  <span>{labels.verified}</span>
                </span>
              )}
            </div>

            <nav aria-label={t('account')}>
              <a href="#account-overview" aria-current="page">
                <AccountIcon name="user" />
                {labels.overview}
              </a>
              <a href="#account-library">
                <AccountIcon name="download" />
                {t('purchases')}
                {licenses.length > 0 && <span className="nav-badge-pill">{licenses.length}</span>}
              </a>
              {orders.length > 0 && (
                <a href="#account-orders">
                  <AccountIcon name="receipt" />
                  Orders
                  <span className="nav-badge-pill">{orders.length}</span>
                </a>
              )}
              <Link href="/downloads">
                <AccountIcon name="download" />
                {t('downloads')}
              </Link>
              <Link href="/tutorials">
                <AccountIcon name="book" />
                {t('guides')}
              </Link>
            </nav>

            <button
              className="customer-signout"
              disabled={busy}
              onClick={logout}
              type="button"
            >
              {t(busy ? 'working' : 'logout')}
            </button>
          </aside>

          {/* Main Account Content */}
          <div className="customer-account-content" id="account-overview">
            <header className="customer-account-heading">
              <span>{t('customerAccount')}</span>
              <h1>{t('accountTitle')}</h1>
              <p>
                {t('signedIn')} <strong>{name}</strong>
              </p>
            </header>

            {downloadStatus && (
              <div
                className={`account-status-toast ${downloadStatus.type === 'success' ? 'toast-success' : 'toast-error'}`}
                role="status"
              >
                <AccountIcon name={downloadStatus.type === 'success' ? 'check' : 'info'} />
                <span>{downloadStatus.message}</span>
              </div>
            )}

            {/* Profile Information Section */}
            <section className="customer-profile-card">
              <div className="account-section-heading">
                <AccountIcon name="user" />
                <h2>{labels.profile}</h2>
                <span className={`customer-verification${verified ? ' verified' : ''}`}>
                  <AccountIcon name={verified ? 'check' : 'info'} />
                  {verified ? labels.verified : t('emailPending')}
                </span>
              </div>

              <dl>
                <div>
                  <dt>{t('fullName')}</dt>
                  <dd>{name}</dd>
                </div>
                <div>
                  <dt>{t('email')}</dt>
                  <dd dir="ltr">{email}</dd>
                </div>
                <div>
                  <dt>License Vault</dt>
                  <dd className="account-metric-accent">
                    {licenses.length} Active {licenses.length === 1 ? 'License' : 'Licenses'}
                  </dd>
                </div>
                <div>
                  <dt>Account Security</dt>
                  <dd className="account-security-tag">
                    <AccountIcon name="shield" />
                    <span>{verified ? 'Protected & Verified' : 'Action Required'}</span>
                  </dd>
                </div>
              </dl>

              {!verified && <p className="account-verification-help">{copy.verification}</p>}
            </section>

            {/* Customer Software Library & Licenses */}
            <section className="customer-library-card" id="account-library">
              <div className="account-section-heading">
                <AccountIcon name="download" />
                <h2>{t('purchases')}</h2>
                {licenses.length > 0 && (
                  <span className="library-total-tag">
                    {licenses.length} {licenses.length === 1 ? 'Product in library' : 'Products in library'}
                  </span>
                )}
              </div>

              {licenses.length > 0 ? (
                <div className="customer-license-list">
                  {licenses.map((lic) => {
                    const isRevealed = !!revealedKeys[lic.id];
                    const isCopied = copiedKey === lic.license_key;
                    const isDownloading = downloadingId === lic.id;
                    const remainingDownloads = Math.max(0, lic.max_downloads - lic.download_count);

                    return (
                      <article key={lic.id} className="license-card">
                        <div className="license-card-header">
                          <div className="license-product-artwork">
                            <img
                              src={lic.product_image || '/plugins/mlam-voice-midi.png'}
                              alt={lic.product_name || 'Plugin'}
                            />
                          </div>

                          <div className="license-product-info">
                            <div className="license-badges">
                              <span className="product-category-tag">
                                {lic.product_category || 'VST3 Plugin'}
                              </span>
                              {lic.release_version && (
                                <span className="product-version-tag">
                                  v{lic.release_version}
                                </span>
                              )}
                              <span className={`license-status-tag ${lic.status}`}>
                                {lic.status === 'active' ? '● Lifetime License' : lic.status}
                              </span>
                            </div>

                            <h3 className="license-product-title">
                              {lic.product_name || 'MLAM Audio Plugin'}
                            </h3>

                            <p className="license-meta-desc">
                              Direct digital entitlement for studio production on Windows 64-bit DAW workstations.
                            </p>
                          </div>
                        </div>

                        {/* License Key Tool & Download Strip */}
                        <div className="license-card-body">
                          <div className="license-key-wrapper">
                            <div className="license-key-label">
                              <AccountIcon name="key" />
                              <span>Serial License Key</span>
                            </div>

                            <div className="license-key-box">
                              <code className="license-key-value">
                                {isRevealed ? lic.license_key : maskKey(lic.license_key)}
                              </code>

                              <div className="license-key-actions">
                                <button
                                  type="button"
                                  className="key-action-btn key-reveal-btn"
                                  onClick={() => toggleReveal(lic.id)}
                                  title={isRevealed ? labels.hide : labels.show}
                                  aria-label={isRevealed ? labels.hide : labels.show}
                                >
                                  <AccountIcon name={isRevealed ? 'eye-off' : 'eye'} />
                                </button>

                                <button
                                  type="button"
                                  className={`key-action-btn key-copy-btn ${isCopied ? 'copied' : ''}`}
                                  onClick={() => copyKey(lic.license_key)}
                                  title="Copy license key to clipboard"
                                >
                                  <AccountIcon name={isCopied ? 'check' : 'copy'} />
                                  <span>{isCopied ? 'Copied!' : 'Copy Key'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="license-download-actions">
                            <div className="download-quota-indicator">
                              <span className="quota-text">
                                <strong>{remainingDownloads}</strong> of {lic.max_downloads} downloads left
                              </span>
                              <div className="quota-bar" aria-hidden="true">
                                <div
                                  className="quota-fill"
                                  style={{
                                    width: `${Math.min(100, (lic.download_count / Math.max(1, lic.max_downloads)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="file-size-hint">
                                {formatBytes(lic.release_file_size)}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="license-download-btn"
                              onClick={() => downloadLicenseRelease(lic)}
                              disabled={isDownloading || remainingDownloads <= 0}
                            >
                              <AccountIcon name="download" />
                              <span>
                                {isDownloading
                                  ? 'Preparing Package...'
                                  : remainingDownloads <= 0
                                  ? 'Limit Reached'
                                  : 'Download Release ZIP'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="customer-library-pending">
                  <span className="library-icon">
                    <AccountIcon name="download" />
                  </span>
                  <p>{t('purchaseNotice')}</p>
                  <a className="button access-submit" href="/#plugins">
                    {t('explore')}
                    <AccountIcon name="arrow" />
                  </a>
                  <small>{t('noPurchaseClaim')}</small>
                </div>
              )}
            </section>

            {/* Orders & Receipts Section */}
            {orders.length > 0 && (
              <section className="customer-profile-card customer-orders-card" id="account-orders">
                <div className="account-section-heading">
                  <AccountIcon name="receipt" />
                  <h2>Order Receipts & History</h2>
                </div>

                <div className="orders-table-wrapper">
                  <table className="customer-orders-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Reference</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => {
                        const dateFormatted = new Date(ord.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });
                        const amountFormatted = `$${(ord.amount_cents / 100).toFixed(2)}`;

                        return (
                          <tr key={ord.id}>
                            <td className="order-date">{dateFormatted}</td>
                            <td className="order-product">
                              <strong>{ord.product_name || 'MLAM Audio Product'}</strong>
                            </td>
                            <td className="order-amount">{amountFormatted}</td>
                            <td className="order-ref">
                              <code>{ord.provider_ref ? ord.provider_ref.slice(0, 14) + '...' : ord.id.slice(0, 8)}</code>
                            </td>
                            <td>
                              <span className={`order-status-badge ${ord.status}`}>
                                {ord.status === 'completed' || ord.status === 'paid' ? 'Paid' : ord.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Helpful Resource Links */}
            <div className="customer-account-links">
              <Link href="/downloads">
                <AccountIcon name="download" />
                <div>
                  <span className="link-title">{t('licensedDownload')}</span>
                  <span className="link-sub">Enter any offline key for instant ZIP streaming</span>
                </div>
                <AccountIcon name="arrow" />
              </Link>
              <Link href="/tutorials">
                <AccountIcon name="book" />
                <div>
                  <span className="link-title">{t('guides')}</span>
                  <span className="link-sub">DAW setup, sound design and VST3 installation guides</span>
                </div>
                <AccountIcon name="arrow" />
              </Link>
            </div>

            {error && (
              <p className="access-feedback access-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>
      <ModernFooter />
    </div>
  );
}
