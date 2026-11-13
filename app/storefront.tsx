"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Download, X } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from './language-provider';
import ProductDescription from './product-description';
import SculptureHero from '@/components/ui/liquid-sculpture-hero';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';
import ProductCard, { type ProductCardProduct } from '@/components/ui/product-card';
import FeaturedRelease from "@/components/ui/featured-release";
import { FEATURED_VIDEO } from "@/lib/site";
import FaqSection from '@/components/ui/faq-section';

type Product = ProductCardProduct;
type Demo = { id:string; product_id:string; version:string; is_active:number; notes:string };

const fallback: Product[] = [
  { id: "voice-midi", name: "MLAM Voice MIDI", category: "MIDI Instrument", description: "Geuza sauti, humming na melody kuwa MIDI inayoweza kuhaririwa ndani ya DAW yako.", price_cents: 2900, status: "published", image: "/plugins/mlam-voice-midi.png", features: "[\"Voice to MIDI\",\"Scale-aware notes\",\"VST3 for Windows\",\"Lifetime license\"]", checkout_url: "" },
  { id: "bushman-bass", name: "Bushman Bass", category: "Bass Instrument", description: "Expressive bass instrument yenye presets za electric, slap, fretless na deep sub.", price_cents: 4900, status: "coming-soon", image: "/plugins/bushman-bass.png", features: "[\"Expressive engine\",\"Preset browser\",\"MIDI control\",\"VST3\"]", checkout_url: "" },
  { id: "mlam-piano", name: "MLAM Piano", category: "Piano Instrument", description: "The piano instrument from MLAM Studio Pro. Standalone release coming soon.", price_cents: 0, status: "coming-soon", image: "/plugins/mlam-piano.png", features: "[\"Piano instrument\",\"MIDI keyboard\",\"MLAM studio design\"]", checkout_url: "" },
  { id: "pro-eq", name: "MLAM Pro EQ", category: "Audio Effect", description: "Parametric EQ safi yenye spectrum ya realtime na workflow ya haraka kwa mixing.", price_cents: 2500, status: "coming-soon", image: "", features: "[\"Dynamic spectrum\",\"Zero latency\",\"A/B compare\",\"VST3\"]", checkout_url: "" },
  { id: "stereo-imager", name: "MLAM Imager / Stereo Forge", category: "Stereo Effect", description: "The Stereo Forge Imager from BLACK-XPACE. Shape stereo width with mid/side processing, input gain and output gain. Standalone release coming soon.", price_cents: 0, status: "coming-soon", image: "/plugins/mlam-imager.svg", features: "[\"Stereo Width 0–200%\",\"Mid/side processing\",\"Input / output gain\",\"Bypass\"]", checkout_url: "" },
  { id: "mlam-daw", name: "MLAM Studio Pro", category: "DAW", description: "Our complete workspace for recording, arranging and mixing music. Coming soon.", price_cents:0,status:"coming-soon",image:"/mlam-studio-pro-splash.png",features:'["Record","Arrange","Mix","Stock instruments"]',checkout_url:"" },
];

function featureList(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

const dawIntegrations = [
  {
    name: "Ableton Live",
    content: (
      <svg height="21" viewBox="0 0 115 26" fill="#0f172a">
        <rect x="0" y="1" width="3.8" height="24" rx="1.2" />
        <rect x="7.5" y="1" width="3.8" height="24" rx="1.2" />
        <rect x="15" y="1" width="3.8" height="24" rx="1.2" />
        <rect x="22.5" y="1" width="3.8" height="24" rx="1.2" />
        <rect x="34" y="2" width="24" height="3.8" rx="1.2" />
        <rect x="34" y="9" width="24" height="3.8" rx="1.2" />
        <rect x="34" y="16" width="24" height="3.8" rx="1.2" />
        <rect x="34" y="23" width="24" height="3.8" rx="1.2" />
        <text x="68" y="19" fill="#0f172a" fontSize="15" fontWeight="700" letterSpacing="-0.02em" fontFamily="'Inter', system-ui, sans-serif">Live</text>
      </svg>
    )
  },
  {
    name: "FL Studio",
    content: (
      <img src="/logos/fl-studio-logo.png" alt="FL Studio" className="core-platform-logo-img logo-fl" />
    )
  },
  {
    name: "Apple Logic Pro",
    content: (
      <svg height="21" viewBox="0 0 120 26" fill="#0f172a">
        <rect x="1" y="2" width="22" height="22" rx="6" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.6" />
        <path d="M6 13v-3m3 6v-8m3 11v-14m3 12V6m3 8v-5m3 3v-2" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
        <text x="31" y="18" fill="#0f172a" fontSize="14" fontWeight="700" letterSpacing="-0.02em" fontFamily="'Inter', system-ui, sans-serif">Logic Pro</text>
      </svg>
    )
  },
  {
    name: "Steinberg Cubase",
    content: (
      <img src="/logos/cubase-logo.png" alt="Steinberg Cubase" className="core-platform-logo-img logo-cubase" />
    )
  },
  {
    name: "PreSonus Studio One",
    content: (
      <img src="/logos/studio-one-logo.jpg" alt="PreSonus Studio One" className="core-platform-logo-img logo-studio-one" />
    )
  },
  {
    name: "Avid Pro Tools",
    content: (
      <svg height="21" viewBox="0 0 125 26" fill="#0f172a">
        <circle cx="11" cy="13" r="10" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1.6" />
        <path d="M5 13h3l2-5 3 10 2-5h2" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="28" y="18" fill="#0f172a" fontSize="13" fontWeight="800" letterSpacing="0.04em" fontFamily="'Inter', system-ui, sans-serif">PRO TOOLS</text>
      </svg>
    )
  },
  {
    name: "Bitwig Studio",
    content: (
      <svg height="21" viewBox="0 0 125 26" fill="#0f172a">
        <circle cx="4" cy="10" r="2.2" fill="#ea580c" />
        <circle cx="10" cy="10" r="2.2" fill="#ea580c" />
        <circle cx="16" cy="10" r="2.2" fill="#ea580c" />
        <circle cx="4" cy="16" r="2.2" fill="#ea580c" />
        <circle cx="10" cy="16" r="2.2" fill="#ea580c" />
        <circle cx="16" cy="16" r="2.2" fill="#ea580c" />
        <text x="26" y="18" fill="#0f172a" fontSize="13" fontWeight="700" letterSpacing="-0.01em" fontFamily="'Inter', system-ui, sans-serif">BITWIG</text>
      </svg>
    )
  },
  {
    name: "Cockos REAPER",
    content: (
      <svg height="21" viewBox="0 0 115 26" fill="#0f172a">
        <path d="M4 19L11 4l7 15-7-4-7 4z" fill="#0284c7" />
        <text x="26" y="18" fill="#0f172a" fontSize="13" fontWeight="800" letterSpacing="0.03em" fontFamily="'Inter', system-ui, sans-serif">REAPER</text>
      </svg>
    )
  }
];

export default function Storefront({ initialProducts, initialDemos }: { initialProducts?: Product[]; initialDemos?: Demo[] }) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const serverLoaded = !!initialProducts?.length;
  const [products, setProducts] = useState(serverLoaded ? initialProducts! : fallback);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Product | null>(null);
  const [demos, setDemos] = useState<Demo[]>(initialDemos ?? []);

  useEffect(() => {
    // The server already rendered the catalog; only fetch when it could not.
    if (serverLoaded) return;
    fetch("/api/products")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        const result = data as { products?: Product[] };
        if (result.products?.length) setProducts(result.products);
      })
      .catch(() => undefined);
    fetch("/api/demos").then(response=>response.ok ? response.json() : Promise.reject()).then(data=>setDemos((data as { demos?:Demo[] }).demos ?? [])).catch(()=>undefined);
  }, [serverLoaded]);

  useEffect(() => {
    const productId = new URLSearchParams(window.location.search).get("product");
    if (productId) setSelected(products.find(product=>product.id===productId) ?? null);
  }, [products]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const featured = products.find(product => product.id === "voice-midi") ?? fallback[0];
  const demoFor = (product:Product) => product.status === "published" ? demos.find(demo=>demo.product_id===product.id && demo.is_active) : undefined;

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const visible = filter === "All" ? products : products.filter((product) => product.category === filter);
  const buy = (product: Product) => {
    if (product.status !== 'published') { setSelected(product); return; }
    router.push(`/checkout?product=${encodeURIComponent(product.id)}`);
  };

  return <main>
    <ModernNav activeTab="home" overlay />
    <SculptureHero
      showNav={false}
      theme="dark"
      darkBackground="#141414"
      className="hero-light hero-video"
      textColor="#ffffff"
      accentColor="#ffffff"
      backdropText=""
      src="/logo-mark-black-512.png"
      darkSrc="/logo-mark-black-512.png"
      mobileSrc="/logo-mark-black-512.png"
      mobileDarkSrc="/logo-mark-black-512.png"
      disableLiquid={true}
      interactive={false}
      liquid={0}
      strength={0}
      turbulence={0}
      ambient={false}
      centerNode={<video className="hero-bg-video" src="/videos/hero.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />}
      brandNode={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
          <img
            src="/logo-mark-black-512.png"
            alt="MLAM"
            className="mn-brand-mark"
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.4))'
            }}
          />
          <span style={{ letterSpacing: '-0.02em', fontSize: '16.5px', opacity: 0.75 }}>
            <span style={{ fontWeight: 800 }}>MLAM</span> <span style={{ fontWeight: 400 }}>STUDIO PRO</span>
          </span>
        </span>
      }
      eyebrow={t('heroTop') || "BUILT FOR REAL PRODUCERS"}
      headline={`${t('heroFirst') || "Turn inspiration"}\n${t('heroSecond') || "into"} ${t('heroAccent') || "sound."}`}
      headlineAccent={`${t('heroSecond') || "into"} ${t('heroAccent') || "sound."}`}
      body={t('heroCopy') || "Original instruments and effects built by BLACK-XPACE for fast ideas, expressive performance and professional mixes."}
      primaryCta={{ label: t('explore') || "Explore plugins", href: "#plugins" }}
      secondaryCta={{ label: t('guides') || "How to use", href: "/tutorials" }}
      navLinks={[
        { label: "Home", href: "/" },
        { label: t('plugins'), href: '#plugins' },
        { label: t('daw'), href: '#plugins' },
        { label: t('guides'), href: '/tutorials' },
        { label: t('downloads'), href: '/downloads' }
      ]}
      navCta={{ label: t('account'), href: "/account" }}
      height="94svh"
    />

    {/* Featured Release - Flagship Voice-to-MIDI Instrument */}
    <section className="showcase-section fr-section" id="voice-midi">
      <FeaturedRelease
        product={featured}
        videoId={FEATURED_VIDEO.id}
        videoTitle={FEATURED_VIDEO.title}
        demoId={demoFor(featured)?.id}
        kicker="New from BLACK-XPACE"
        title="Featured release"
        onBuy={() => buy(featured)}
      />
    </section>

    {/* Core Studio Platform & Audio Engine - Modern Stack Integrations Section */}
    <section className="core-platform-section">
      <div className="core-platform-container">

        {/* Main Bold Headline */}
        <h2 className="core-platform-title">
          Works with your stack
        </h2>

        {/* Explanatory Subtitle */}
        <p className="core-platform-subtitle">
          Connect effortlessly with the digital audio workstations and studio instruments you already use. Engineered for zero latency and native 64-bit float precision.
        </p>

        {/* DAW & Industry Standards Integration Logos - White Card scrolling Left to Right */}
        <div className="core-platform-logos-card" aria-label="Compatible Digital Audio Workstations">
          <div className="core-platform-marquee-track">
            {dawIntegrations.concat(dawIntegrations).map((logo, idx) => (
              <div key={idx} className="core-platform-logo-item" title={logo.name}>
                {logo.content}
              </div>
            ))}
          </div>
        </div>

        {/* Center CTA Button */}
        <div>
          <a href="#plugins" className="core-platform-cta-btn">
            <span>Explore Plugins & Integrations</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <section className="store" id="plugins">
      <div className="section-heading">
        <span className="kicker">BLACK-XPACE PLUGIN STORE</span>
        <h2>{t('tools')}</h2>
        <p>
          {language === 'sw'
            ? 'Gundua vyombo vya muziki vya kisasa, zana za kugeuza sauti kuwa MIDI, na madoido ya daraja la juu ya studio yaliyoundwa kupanua upeo wako wa sauti. Vimetengenezwa na watayarishaji kwa ajili ya mifumo ya kisasa ya studio, kila zana ya BLACK-XPACE inatoa ufanisi wa bila ucheleweshaji, udhibiti rahisi, na ubora safi wa sauti kuanzia wazo la kwanza hadi master kamili.'
            : 'Explore precision-engineered virtual instruments, responsive MIDI converters, and studio-grade audio processors crafted to expand your creative sonic palette. Built by producers for modern workflows, every BLACK-XPACE tool delivers zero-latency performance, intuitive control, and pristine sound quality from your initial melody to the final master.'}
        </p>
      </div>
      <div className="filters">{categories.map((category) => <button className={filter === category ? "active" : ""} key={category} onClick={() => setFilter(category)}>{category==='All'?t('all'):category}</button>)}</div>
      <div className="product-grid">
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            highlight={featureList(product.features)[0] || (product.status === "published" ? "64-bit VST3 for Windows" : t('comingSoon'))}
            demoId={demoFor(product)?.id}
            onBuy={() => buy(product)}
          />
        ))}
      </div>
    </section>

    <FaqSection />

    <section className="showcase-section help-section" id="support">
      <div className="showcase-header">
        <span className="showcase-kicker">Support that knows the product</span>
        <h2 className="showcase-title">From install to first sound</h2>
        <p className="showcase-subtitle">
          Talk directly to the people who build BLACK-XPACE tools, or learn at your own pace with step-by-step video guides.
        </p>
      </div>
      <div className="help-grid">
        <article className="help-card">
          <div className="help-card-top">
            <div className="help-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="help-card-heading">
              <span className="help-card-badge">Direct support</span>
              <h3 className="help-card-title">Contact support</h3>
            </div>
          </div>
          <p className="help-card-desc">Need help with setup, licensing or DAW compatibility? Talk directly to the BLACK-XPACE team and get answers fast.</p>
          <a className="help-card-btn primary" href="mailto:melaninentertainment255@gmail.com">
            <span>Contact support</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </a>
        </article>
        <article className="help-card">
          <div className="help-card-top">
            <div className="help-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div className="help-card-heading">
              <span className="help-card-badge">Learn with BLACK-XPACE</span>
              <h3 className="help-card-title">How to use</h3>
            </div>
          </div>
          <p className="help-card-desc">Watch video guides for every BLACK-XPACE product, from your very first setup to mastering each control.</p>
          <Link className="help-card-btn primary" href="/tutorials">
            <span>Watch guides</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </article>
      </div>
    </section>
    <ModernFooter />

    {selected && (
      <div className="modal-backdrop" onClick={() => setSelected(null)}>
        <div className="modal" role="dialog" aria-modal="true" aria-label={selected.name} onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" aria-label="Close product details" onClick={() => setSelected(null)}><X size={20} aria-hidden="true" /></button>

          {/* Left Side: Hardware Preview Chassis */}
          <div className="modal-visual-side">
            <div className="modal-visual-top">
              <span className="modal-category-badge">{selected.category}</span>
              <span className={`modal-status-badge ${selected.status}`}>
                {selected.status === "published" ? t('available') : t('comingSoon')}
              </span>
            </div>

            <img
              className="modal-product-image"
              src={selected.image || "/logo-mark-black-512.png"}
              alt={selected.name}
            />

            <div className="modal-visual-footer">
              <span>VST3 · 64-Bit Native</span>
              <span>Zero Latency</span>
            </div>
          </div>

          {/* Right Side: Details, Features & Actions */}
          <div className="modal-info-side">
            <h2 className="modal-title">{selected.name}</h2>
            <div className="modal-desc">
              <ProductDescription product={selected} />
            </div>

            <ul className="modal-features">
              {featureList(selected.features).map((feature) => (
                <li key={feature} className="modal-feature-item">
                  <span className="modal-feature-check"><Check size={11} strokeWidth={3.5} aria-hidden="true" /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="modal-price-box">
              <span className="modal-price-val">
                {selected.price_cents > 0 ? `$${(selected.price_cents / 100).toFixed(0)}` : "Free"}
              </span>
              <span className="modal-price-sub">
                {selected.status === "published" ? "USD · Lifetime License" : "Planned Release"}
              </span>
            </div>

            <div className="modal-actions-wrap">
              <button
                className="product-pill-btn primary"
                onClick={() =>
                  selected.status === "published"
                    ? buy(selected)
                    : (location.href = `/plugins/${encodeURIComponent(selected.slug || selected.id)}`)
                }
              >
                {selected.status === "published" ? t('buy') : t('notify')}
              </button>

              {demoFor(selected) ? (
                <a className="modal-demo-btn" href={`/api/demos/${demoFor(selected)!.id}/download`}>
                  {t('tryDemo')}<Download className="ic ic-after" size={16} aria-hidden="true" />
                </a>
              ) : (
                <button className="modal-demo-btn" disabled>
                  {t('demoSoon')}
                </button>
              )}
            </div>

            {selected.status === "published" && (
              <Link className="modal-secondary-link" href="/downloads">
                {t('licensedDownload')}<Download className="ic ic-after" size={16} aria-hidden="true" />
              </Link>
            )}

            <Link className="modal-secondary-link" href={`/plugins/${encodeURIComponent(selected.slug || selected.id)}`}>
              Full product page<ArrowRight className="ic ic-after" size={16} aria-hidden="true" />
            </Link>

            {demoFor(selected)?.notes && (
              <p style={{ fontSize: "11.5px", color: "#64748b", marginTop: "10px" }}>
                {demoFor(selected)!.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </main>;
}
