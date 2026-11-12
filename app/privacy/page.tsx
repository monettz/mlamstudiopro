import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoSection } from '@/components/ui/info-page';
import { POLICIES_UPDATED, SITE_NAME, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy — MLAM Studio Pro',
  description: 'What information MLAM Studio Pro collects, why, where it is kept, and your choices.',
};

export default function PrivacyPage() {
  return (
    <InfoPage
      kicker="PRIVACY"
      title={<>Your data,<br />kept simple.</>}
      intro="We only collect what we need to run your account, deliver your plugins and answer you. We don't sell your data and we don't use advertising trackers."
      updated={POLICIES_UPDATED}
    >
      <InfoSection title="What we collect">
        <ul className="info-points">
          <li><strong>Your account:</strong> your name and email address. Your password is handled by our sign-in provider and is never stored by us in readable form.</li>
          <li><strong>Purchases:</strong> the product, amount, payment method and payment reference, your email and, if you give it, your phone number. These are recorded when a payment is confirmed.</li>
          <li><strong>Licences:</strong> your licence key, the email it belongs to and how many times it has been used to download.</li>
          <li><strong>&ldquo;Notify me&rdquo; requests:</strong> your email and the product you want to hear about.</li>
          <li><strong>Messages:</strong> anything you send us by email.</li>
        </ul>
        <p>We do not store card numbers. When online payment is added, card and mobile-money details go directly to the payment provider.</p>
      </InfoSection>

      <InfoSection title="Why we use it">
        <ul className="info-points">
          <li>To sign you in and show your licences, orders and downloads.</li>
          <li>To deliver your licence key and plugin downloads.</li>
          <li>To answer support questions and tell you when a product you asked about launches.</li>
          <li>To protect the site, for example by limiting repeated sign-in attempts.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Cookies and storage on your device">
        <ul className="info-points">
          <li><strong>Sign-in cookies</strong> keep you signed in. They are required for your account to work.</li>
          <li><strong>A language cookie</strong> remembers the language you chose.</li>
          <li><strong>Your browser&apos;s storage</strong> remembers small display choices, such as the dashboard style.</li>
        </ul>
        <p>We don&apos;t use advertising or analytics cookies.</p>
      </InfoSection>

      <InfoSection title="Who helps us run the site">
        <p>
          Your information is kept with trusted service providers that run parts of the site for us: our sign-in and database provider (Supabase),
          file storage for downloads and videos (Cloudflare), email delivery when we send you a licence key, and our website host.
          They may only use your information to provide these services to us.
        </p>
      </InfoSection>

      <InfoSection title="How long we keep it">
        <p>
          We keep your account and purchase records for as long as your account exists, so your licences keep working, and longer where
          the law requires us to keep sales records. &ldquo;Notify me&rdquo; requests are kept until the product launches or you ask us to remove them.
        </p>
      </InfoSection>

      <InfoSection title="Your choices">
        <p>
          You can ask us to show, correct or delete the information we hold about you. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from
          the address on your account. Deleting your account also removes access to your licences.
        </p>
      </InfoSection>

      <InfoSection title="Changes">
        <p>If we change this page we will update the date at the top. Questions? Visit the <Link href="/contact">Support Hub</Link>.</p>
        <p className="info-note">{SITE_NAME}</p>
      </InfoSection>
    </InfoPage>
  );
}
