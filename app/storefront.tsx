"use client";

import { useEffect, useMemo, useState } from "react";
import RotatingLogo from './rotating-logo';
import { useLanguage } from './language-provider';
import ProductDescription from './product-description';

type Product = {
  id: string; name: string; category: string; description: string;
  price_cents: number; status: string; image: string; features: string; checkout_url: string; description_translations?:string;
};
type Demo = { id:string; product_id:string; version:string; is_active:number; notes:string };

const fallback: Product[] = [
  { id: "voice-midi", name: "MLAM Voice MIDI", category: "MIDI Instrument", description: "Geuza sauti, humming na melody kuwa MIDI inayoweza kuhaririwa ndani ya DAW yako.", price_cents: 2900, status: "published", image: "/plugins/mlam-voice-midi.png", features: "[\"Voice to MIDI\",\"Scale-aware notes\",\"VST3 for Windows\",\"Lifetime license\"]", checkout_url: "" },
  { id: "bushman-bass", name: "Bushman Bass", category: "Bass Instrument", description: "Expressive bass instrument yenye presets za electric, slap, fretless na deep sub.", price_cents: 4900, status: "coming-soon", image: "/plugins/bushman-bass.png", features: "[\"Expressive engine\",\"Preset browser\",\"MIDI control\",\"VST3\"]", checkout_url: "" },
  { id: "mlam-piano", name: "MLAM Piano", category: "Piano Instrument", description: "The piano instrument from MLAM Studio Pro. Standalone release coming soon.", price_cents: 0, status: "coming-soon", image: "/plugins/mlam-piano.png", features: "[\"Piano instrument\",\"MIDI keyboard\",\"MLAM studio design\"]", checkout_url: "" },
  { id: "pro-eq", name: "MLAM Pro EQ", category: "Audio Effect", description: "Parametric EQ safi yenye spectrum ya realtime na workflow ya haraka kwa mixing.", price_cents: 2500, status: "coming-soon", image: "/plugins/mlam-voice-midi.png", features: "[\"Dynamic spectrum\",\"Zero latency\",\"A/B compare\",\"VST3\"]", checkout_url: "" },
  { id: "stereo-imager", name: "MLAM Imager / Stereo Forge", category: "Stereo Effect", description: "The Stereo Forge Imager from MLAM Studio Pro. Shape stereo width with mid/side processing, input gain and output gain. Standalone release coming soon.", price_cents: 0, status: "coming-soon", image: "/plugins/mlam-imager.svg", features: "[\"Stereo Width 0–200%\",\"Mid/side processing\",\"Input / output gain\",\"Bypass\"]", checkout_url: "" },
  { id: "mlam-daw", name: "MLAM Studio Pro", category: "DAW", description: "Our complete workspace for recording, arranging and mixing music. Coming soon.", price_cents:0,status:"coming-soon",image:"/mlam-studio-pro-splash.png",features:'["Record","Arrange","Mix","Stock instruments"]',checkout_url:"" },
];

function featureList(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

export default function Storefront() {
  const {t}=useLanguage();
  const [products, setProducts] = useState(fallback);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Product | null>(null);
  const [demos, setDemos] = useState<Demo[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        const result = data as { products?: Product[] };
        if (result.products?.length) setProducts(result.products);
      })
      .catch(() => undefined);
    fetch("/api/demos").then(response=>response.ok ? response.json() : Promise.reject()).then(data=>setDemos((data as { demos?:Demo[] }).demos ?? [])).catch(()=>undefined);
  }, []);

  useEffect(() => {
    const productId = new URLSearchParams(window.location.search).get("product");
    if (productId) setSelected(products.find(product=>product.id===productId) ?? null);
  }, [products]);

  const demoFor = (product:Product) => product.status === "published" ? demos.find(demo=>demo.product_id===product.id && demo.is_active) : undefined;

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const visible = filter === "All" ? products : products.filter((product) => product.category === filter);
  const buy = (product: Product) => {
    if (product.status !== 'published') { setSelected(product); return; }
    location.href = `/checkout?product=${encodeURIComponent(product.id)}`;
  };

  return <main>
    <header className="site-header">
      <a className="brand" href="/"><img src="/mlam-mark-3d-green.png" alt="MLAM"/><span><b>MLAM</b> STUDIO PRO<small>CREATE · PRODUCE · OWN YOUR SOUND</small></span></a>
      <nav><a href="#plugins">{t('plugins')}</a><a href="#studio">{t('daw')}</a><a href="/tutorials">{t('guides')}</a><a href="/downloads">{t('downloads')}</a><a href="#support">{t('support')}</a></nav>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><i/> {t('heroTop')}</div>
        <h1>{t('heroFirst')}<br/>{t('heroSecond')} <em>{t('heroAccent')}</em></h1>
        <p>{t('heroCopy')}</p>
        <div className="hero-actions"><a className="button primary" href="#plugins">{t('explore')}</a><a className="button ghost" href="#voice-midi">{t('seeVoice')}</a></div>
        <div className="trust"><span>✓ Instruments & effects</span><span>✓ Licensed downloads</span><span>✓ Creator support</span></div>
      </div>
      <div className="hero-visual studio-hero-visual"><div className="halo"/><RotatingLogo/><div className="plugin-stage"><div className="stage-top"><span>MLAM VOICE MIDI</span><b>FEATURED</b></div><img src="/plugins/mlam-voice-midi.png" alt="MLAM Voice MIDI plugin"/></div></div>
    </section>

    <section className="stats"><div><strong>VST3</strong><span>Instruments & effects</span></div><div><strong>MIDI</strong><span>Creative tools</span></div><div><strong>MLAM</strong><span>Original studio design</span></div><div><strong>DAW</strong><span>Coming soon</span></div></section>

    <section className="store" id="plugins">
      <div className="section-heading"><div><span className="kicker">MLAM PLUGIN STORE</span><h2>{t('tools')}</h2></div><p>Explore MLAM instruments and effects. Already have a license? Get your plugin from customer downloads.</p></div>
      <div className="filters">{categories.map((category) => <button className={filter === category ? "active" : ""} key={category} onClick={() => setFilter(category)}>{category==='All'?t('all'):category}</button>)}</div>
      <div className="product-grid">{visible.map((product, index) => <article className="product-card" key={product.id}>
        <div className={`product-art art-${index % 3}`}><img src={product.image || "/plugins/mlam-voice-midi.png"} alt={product.name}/><span className={`status ${product.status}`}>{product.status === "published" ? t('available') : t('comingSoon')}</span></div>
        <div className="product-body"><span className="category">{product.category}</span><h3>{product.name}</h3><ProductDescription product={product}/><ul>{featureList(product.features).slice(0,4).map((feature)=><li key={feature}>{feature}</li>)}</ul><div className="product-footer"><div>{product.price_cents > 0 ? <><small>{product.status === "published" ? "FULL VERSION · USD" : "PLANNED PRICE · USD"}</small><strong>${(product.price_cents/100).toFixed(2)}</strong></> : <small>PRICE TO BE ANNOUNCED</small>}</div><button onClick={() => product.status === "published" ? buy(product) : setSelected(product)}>{product.status === "published" ? t('buy') : t('notify')}</button></div>
        <div className="product-demo-row"><div><span>DEMO</span><small>{demoFor(product) ? t('tryDemo') : t('demoSoon')}</small></div>{demoFor(product) ? <a className="button ghost" href={`/api/demos/${demoFor(product)!.id}/download`}>{t('tryDemo')} ↓</a> : <button className="button ghost" disabled>{t('tryDemo')}</button>}</div>
        <div className="product-secondary-actions"><button className="details" onClick={() => setSelected(product)}>{t('details')} →</button>{product.status === "published" ? <a className="details download-link" href="/downloads">{t('licensedDownload')} ↓</a> : <span className="pending-license">{t('licensedDownload')} — {t('comingSoon')}</span>}</div></div>
      </article>)}</div>
    </section>

    <section className="spotlight" id="voice-midi"><div className="spotlight-image"><img src="/plugins/mlam-voice-midi.png" alt="Voice MIDI interface"/></div><div><span className="kicker">FEATURED RELEASE</span><h2>MLAM Voice MIDI.</h2><ProductDescription product={products.find(product=>product.id==='voice-midi')??fallback[0]}/><div className="workflow"><div><b>01</b><span><strong>Listen</strong>Capture your voice</span></div><div><b>02</b><span><strong>Detect</strong>Find pitch and timing</span></div><div><b>03</b><span><strong>Create</strong>Send clean MIDI</span></div></div><button className="button primary" onClick={() => buy(products.find(product=>product.id==='voice-midi') ?? fallback[0])}>{t('seeVoice')}</button></div></section>

    <section className="spotlight daw-coming-soon" id="studio"><div className="spotlight-image"><img src="/mlam-studio-pro-splash.png" alt="MLAM Studio Pro music-production workspace"/></div><div><span className="kicker">{t('daw')} · {t('comingSoon')}</span><h2>MLAM Studio Pro.</h2><ProductDescription product={products.find(product=>product.id==='mlam-daw')??fallback[5]}/><a className="button ghost" href="#plugins">{t('explore')}</a></div></section>
    <section className="support" id="support"><div><span className="kicker">SUPPORT THAT KNOWS THE PRODUCT</span><h2>From install to first sound.</h2></div><p>Need help with setup or compatibility? Talk directly to MLAM support.</p><a className="button ghost" href="mailto:melaninentertainment255@gmail.com">Contact support</a></section>
    <section className="support tutorial-promo"><div><span className="kicker">LEARN WITH MLAM</span><h2>How to use.</h2></div><p>Watch video guides for MLAM products, from your first setup to using their controls.</p><a className="button primary" href="/tutorials">Watch guides ▶</a></section>
    <footer><div className="brand mini"><img src="/mlam-logo.png" alt=""/><span><b>MLAM</b> STUDIO PRO</span></div><span>© 2026 Melanin Entertainment. All rights reserved.</span><a href="/tutorials">How to use</a><a href="/downloads">Customer downloads</a></footer>

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal" role="dialog" aria-modal="true" aria-label={selected.name} onClick={(event)=>event.stopPropagation()}><button className="modal-close" aria-label="Close product details" onClick={()=>setSelected(null)}>×</button><img className="modal-product-image" src={selected.image || "/plugins/mlam-voice-midi.png"} alt={selected.name}/><span className="category">{selected.category}</span><h2>{selected.name}</h2><ProductDescription product={selected}/><ul>{featureList(selected.features).map((feature)=><li key={feature}>✓ {feature}</li>)}</ul><p className="modal-price">{selected.price_cents > 0 ? `${selected.status === "published" ? "Full version" : "Planned price"}: $${(selected.price_cents/100).toFixed(2)} USD` : "Price to be announced"}</p><div className="modal-buy-actions"><button className="button primary" onClick={()=>selected.status === "published" ? buy(selected) : location.href=`mailto:melaninentertainment255@gmail.com?subject=${encodeURIComponent(`Notify me: ${selected.name}`)}`}>{selected.status === "published" ? t('buy') : t('notify')}</button>{demoFor(selected) ? <a className="button ghost" href={`/api/demos/${demoFor(selected)!.id}/download`}>{t('tryDemo')} ↓</a> : <button className="button ghost" disabled>{t('demoSoon')}</button>}{selected.status === "published" && <a className="details" href="/downloads">{t('licensedDownload')} ↓</a>}</div>{demoFor(selected)?.notes && <p>{demoFor(selected)!.notes}</p>}</div></div>}
  </main>;
}
