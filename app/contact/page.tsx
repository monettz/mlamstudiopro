import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoSection } from '@/components/ui/info-page';
import { SITE_LOCATION, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact & Support — BLACK-XPACE',
  description: 'Get help with installing MLAM plugins, licence keys, downloads and DAW compatibility.',
};

const subject = encodeURIComponent('MLAM support request');
const body = encodeURIComponent('Product:\nDAW and version:\nWindows version:\nLicence key (if any):\n\nWhat happened:\n');

export default function ContactPage() {
  return (
    <InfoPage
      kicker="SUPPORT HUB"
      title={<>We&apos;re here<br />to help.</>}
      intro="Questions about installing, licence keys, downloads or DAW compatibility go straight to the MLAM team."
      activeTab="support"
    >
      <section className="info-contact-card">
        <div>
          <span className="info-contact-label">Email support</span>
          <a className="info-contact-email" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <p>We reply by email, usually within one to two working days. Based in {SITE_LOCATION} (East Africa Time).</p>
        </div>
        <a className="info-btn" href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>Email the team</a>
      </section>

      <InfoSection title="Help yourself first">
        <ul className="info-link-grid">
          <li><Link href="/tutorials"><strong>Video guides</strong><span>Install, set up and use every MLAM product.</span></Link></li>
          <li><Link href="/downloads"><strong>Download with a key</strong><span>Get your plugin ZIP again with your licence key.</span></Link></li>
          <li><Link href="/account"><strong>Your account</strong><span>See your licences, orders and downloads left.</span></Link></li>
          <li><Link href="/licence"><strong>Licence terms</strong><span>What your licence lets you do.</span></Link></li>
        </ul>
      </InfoSection>

      <InfoSection title="To get a faster answer, include">
        <ul className="info-points">
          <li>The product name and version.</li>
          <li>Your DAW and its version (for example FL Studio 21), and your Windows version.</li>
          <li>Your licence key if the question is about a purchase or download. Never send your account password.</li>
          <li>What you did, what you expected, and what happened instead. A screenshot helps.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
