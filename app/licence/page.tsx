import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoSection } from '@/components/ui/info-page';
import { POLICIES_UPDATED, SITE_NAME, SUPPORT_EMAIL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Licence — BLACK-XPACE',
  description: 'What your MLAM plugin licence allows: lifetime use, music you make is yours, and your licence key is personal.',
};

export default function LicencePage() {
  return (
    <InfoPage
      kicker="LICENCE"
      title={<>Your licence,<br />in plain words.</>}
      intro={<>When you buy an {SITE_NAME} plugin you get a licence to use it. This page explains what that licence allows.</>}
      updated={POLICIES_UPDATED}
    >
      <InfoSection title="The short version">
        <ul className="info-points">
          <li><strong>Use it for life.</strong> A paid licence does not expire.</li>
          <li><strong>Your music is yours.</strong> Use the plugin in personal and commercial music, with no royalties to pay.</li>
          <li><strong>Your key is personal.</strong> Don&apos;t share, sell or publish your licence key or the plugin files.</li>
        </ul>
      </InfoSection>

      <InfoSection title="1. What you may do">
        <ul className="info-points">
          <li>Install and use the plugin on computers you own or use yourself.</li>
          <li>Make, release, sell and stream music, beats and sounds created with the plugin. You keep all rights to your music.</li>
          <li>Download the plugin again with your licence key, up to the number of downloads shown for that key in your account.</li>
        </ul>
      </InfoSection>

      <InfoSection title="2. What you may not do">
        <ul className="info-points">
          <li>Share, sell, rent or give away your licence key, or the plugin installer and files.</li>
          <li>Upload the plugin, or its built-in presets and sounds as a standalone sample pack, for others to download.</li>
          <li>Copy, modify, reverse-engineer or remove the protection from the plugin, except where the law allows it.</li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Licence keys and downloads">
        <p>
          Each purchase comes with one licence key. The key has a download limit, shown in your account and in the email with your key.
          If you run out of downloads for a reason that isn&apos;t your fault, <Link href="/contact">contact us</Link> and we will help.
          A key may be cancelled if it is shared publicly or used to break these terms.
        </p>
      </InfoSection>

      <InfoSection title="4. Demos and coming-soon products">
        <p>
          Demo versions are for trying the plugin before you buy and may have limits. Products marked &ldquo;coming soon&rdquo; are not for sale yet;
          you can ask to be told when they launch.
        </p>
      </InfoSection>

      <InfoSection title="5. Updates and support">
        <p>
          Bug-fix updates for a version you bought are included. Bigger new versions may be offered separately.
          Plugins currently run as VST3 on Windows (64-bit); check each product page before buying.
        </p>
      </InfoSection>

      <InfoSection title="6. Ownership and responsibility">
        <p>
          The plugin, its code, sounds and design remain the property of {SITE_NAME}; you are buying a licence to use them, not the plugin itself.
          We work hard to make our plugins reliable, but they are provided as they are, and we are not responsible for loss of data or projects.
          Keep backups of your work.
        </p>
      </InfoSection>

      <InfoSection title="Questions">
        <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or visit the <Link href="/contact">Support Hub</Link>.</p>
      </InfoSection>
    </InfoPage>
  );
}
