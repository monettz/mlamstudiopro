import Link from "next/link";
import FaqTabs, { type FaqTopic } from "./faq-tabs";

type Faq = { topic: FaqTopic; q: string; a: React.ReactNode; text: string };

// Keep answers in step with what the site actually does: checkout payments are
// not live yet, plugins ship as 64-bit Windows VST3 only.
const faqs: Faq[] = [
  {
    topic: "Licence",
    q: "Is it a one-time purchase or a subscription?",
    text: "A one-time purchase. You pay once and keep your BLACK-XPACE license for life, with no monthly fees.",
    a: <>A one-time purchase. You pay once and keep your BLACK-XPACE license for life, with no monthly fees.</>,
  },
  {
    topic: "Compatibility",
    q: "Which DAWs do BLACK-XPACE plugins work with?",
    text: "Any DAW that loads 64-bit VST3 plugins on Windows, including FL Studio, Ableton Live, Cubase, Studio One, Reaper and Bitwig. Pro Tools (AAX) and Logic Pro (AU) are not supported yet.",
    a: <>Any DAW that loads <strong>64-bit VST3</strong> plugins on Windows, including FL Studio, Ableton Live, Cubase, Studio One, Reaper and Bitwig. Pro Tools (AAX) and Logic Pro (AU) are not supported yet.</>,
  },
  {
    topic: "Compatibility",
    q: "Do BLACK-XPACE plugins work on Mac?",
    text: "Not yet. BLACK-XPACE plugins are currently available for 64-bit Windows only. A macOS version is not available at this time.",
    a: <>Not yet. BLACK-XPACE plugins are currently available for <strong>64-bit Windows</strong> only. A macOS version is not available at this time.</>,
  },
  {
    topic: "Payment",
    q: "Can I pay with Mobile Money?",
    text: "Yes. Checkout is built for M-Pesa, Airtel Money, Mixx by Yas and HaloPesa, as well as Visa and Mastercard. Online payment is still being connected; until it goes live, email BLACK-XPACE support to buy.",
    a: <>Yes. Checkout is built for <strong>M-Pesa, Airtel Money, Mixx by Yas and HaloPesa</strong>, as well as Visa and Mastercard. Online payment is still being connected; until it goes live, <a href="mailto:melaninentertainment255@gmail.com">email BLACK-XPACE support</a> to buy.</>,
  },
  {
    topic: "Downloads",
    q: "How do I download my plugin after buying?",
    text: "You receive a license key that starts with MLAM-. Enter it on the Downloads page to get the installer ZIP. Each key includes a limited number of downloads; contact support if you reach the limit.",
    a: <>You receive a license key that starts with <code>MLAM-</code>. Enter it on the <Link href="/downloads">Downloads</Link> page to get the installer ZIP. Each key includes a limited number of downloads; contact support if you reach the limit.</>,
  },
  {
    topic: "Licence",
    q: "Can I try a plugin before buying?",
    text: "Yes, where a free demo is available. Look for the Try button on the product card or product page.",
    a: <>Yes, where a free demo is available. Look for the <strong>Try</strong> button on the product card or product page.</>,
  },
  {
    topic: "Releases",
    q: "When will the coming-soon plugins be released?",
    text: "Release dates are announced when each plugin is ready. Press Notify me on a product to hear about it first.",
    a: <>Release dates are announced when each plugin is ready. Press <strong>Notify me</strong> on a product to hear about it first.</>,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, text }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text } })),
};

export default function FaqSection() {
  return (
    <section className="showcase-section faq-section" id="faq">
      <div className="showcase-header">
        <h2 className="showcase-title">Before you buy</h2>
        <p className="showcase-subtitle">License, compatibility and payment, answered in one place.</p>
      </div>
      <FaqTabs items={faqs.map(({ topic, q, a }) => ({ topic, q, a }))} />
      <p className="faq-more">Still have a question? <a href="mailto:melaninentertainment255@gmail.com">Email BLACK-XPACE support</a></p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
