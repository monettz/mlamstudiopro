import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoSection } from '@/components/ui/info-page';
import { SITE_LOCATION } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About MLAM — MLAM Studio Pro',
  description: 'MLAM Studio Pro builds instruments, MIDI tools and audio effects for music producers, from Dar es Salaam.',
};

const products = [
  { slug: 'voice-midi', name: 'MLAM Voice MIDI', text: 'Hum or sing a melody and get editable MIDI in your DAW.' },
  { slug: 'bushman-bass', name: 'Bushman Bass', text: 'Electric, slap, fretless and deep-sub bass sounds.' },
  { slug: 'pro-eq', name: 'MLAM Pro EQ', text: 'A clean parametric EQ with a realtime spectrum.' },
  { slug: 'stereo-imager', name: 'Stereo Forge', text: 'Shape stereo width while keeping the low end solid.' },
  { slug: 'mlam-daw', name: 'MLAM Studio Pro DAW', text: 'Our own workspace for recording, arranging and mixing.' },
];

export default function AboutPage() {
  return (
    <InfoPage
      kicker="ABOUT MLAM"
      title={<>Made by producers,<br />for producers.</>}
      intro={<>MLAM Studio Pro makes instruments, MIDI tools and audio effects for music producers. We build them in {SITE_LOCATION}, for producers everywhere.</>}
    >
      <InfoSection title="What we do">
        <p>
          We make plugins that help you get from an idea to a finished sound faster: tools that turn your voice into MIDI,
          instruments with sounds ready to use, and effects for clean, wide mixes. Our plugins run as VST3 on Windows (64-bit)
          inside the DAW you already use.
        </p>
      </InfoSection>

      <InfoSection title="Our products">
        <ul className="info-product-list">
          {products.map(product => (
            <li key={product.slug}>
              <Link href={`/plugins/${product.slug}`}>
                <strong>{product.name}</strong>
                <span>{product.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="info-note">Some products are still coming soon. Their pages let you ask to be told when they launch.</p>
      </InfoSection>

      <InfoSection title="How we work">
        <ul className="info-points">
          <li><strong>One licence, yours for life.</strong> Buy once and keep using the plugin. <Link href="/licence">Read the licence</Link>.</li>
          <li><strong>Real people for support.</strong> Questions go straight to the team that builds the tools. <Link href="/contact">Contact us</Link>.</li>
          <li><strong>Learn at your own pace.</strong> Step-by-step video guides for every product. <Link href="/tutorials">Watch the guides</Link>.</li>
        </ul>
      </InfoSection>

      <div className="info-cta">
        <Link className="info-btn" href="/plugins">Browse plugins</Link>
        <Link className="info-btn ghost" href="/contact">Talk to us</Link>
      </div>
    </InfoPage>
  );
}
