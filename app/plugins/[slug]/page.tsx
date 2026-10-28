import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { database, ensureStore, listProducts, type Product } from '@/lib/store';
import ProductDescription from '@/app/product-description';
import ProductGallery from './product-gallery';
import NotifyForm from './notify-form';
import { RelatedProducts, StickyBuyBar } from './product-extras';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';

type PageProps = { params: Promise<{ slug: string }> };
type Demo = { id: string; version: string; notes: string };

const SUPPORT_EMAIL = 'melaninentertainment255@gmail.com';

// Step-by-step copy per product. Products without an entry show their
// features as highlights instead.
const howItWorks: Record<string, { title: string; text: string }[]> = {
  'voice-midi': [
    { title: 'Listen', text: 'Capture your voice or microphone input in real time.' },
    { title: 'Detect', text: 'Find musical pitch, duration and timing automatically.' },
    { title: 'Create', text: 'Send clean, quantized MIDI directly to any track in your DAW.' },
  ],
};

async function findProduct(slug: string) {
  await ensureStore();
  return database().prepare("SELECT * FROM products WHERE (slug=? OR id=?) AND status IN ('published','coming-soon') LIMIT 1")
    .bind(slug, slug).first<Product>();
}

function productFeatures(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
  } catch { return []; }
}

function productGalleryImages(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && (item.startsWith('/') && !item.startsWith('//') || item.startsWith('https://'))) : [];
  } catch { return []; }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: 'Product not found | MLAM Studio Pro' };
  return {
    title: `${product.name} | MLAM Studio Pro`,
    description: product.description,
    openGraph: { title: `${product.name} | MLAM Studio Pro`, description: product.description, images: [product.image] },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) notFound();

  const features = productFeatures(product.features);
  const galleryImages = productGalleryImages(product.gallery_images);
  const demo = product.status === 'published'
    ? await database().prepare("SELECT id,version,notes FROM demo_releases WHERE product_id=? AND is_active=1 ORDER BY created_at DESC LIMIT 1")
      .bind(product.id).first<Demo>()
    : null;
  const guideCount = await database().prepare("SELECT COUNT(*) AS n FROM tutorials WHERE product_id=? AND is_published=1")
    .bind(product.id).first<{ n: number }>();
  const available = product.status === 'published';
  const purchasable = available && product.price_cents > 0;
  const isPlugin = product.category !== 'DAW';
  const price = product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(2)} USD` : '';
  const checkoutHref = `/checkout?product=${encodeURIComponent(product.id)}`;
  const notifyHref = '#notify';
  // The price line already says "Lifetime license", so leave it out of the chips.
  const chips = features.filter((feature) => !/lifetime licen[cs]e/i.test(feature)).slice(0, 4);
  const steps = howItWorks[product.id];

  // node:sqlite rows have a null prototype; rebuild client props as plain objects.
  const descriptionProduct = {
    id: product.id,
    description: product.description,
    description_translations: product.description_translations,
  };
  const related = (await listProducts(true))
    .filter((item) => item.id !== product.id)
    .slice(0, 3)
    .map((item) => ({
      id: item.id, slug: item.slug, name: item.name, category: item.category, description: item.description,
      price_cents: item.price_cents, status: item.status, image: item.image, features: item.features,
      checkout_url: item.checkout_url, description_translations: item.description_translations,
    }));

  return (
    <div className="subpage-wrapper product-page-wrapper">
      <ModernNav activeTab="plugins" />
      <main className="product-detail-page">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link href="/#plugins">Plugins</Link><span aria-hidden="true">/</span><span>{product.name}</span>
        </nav>

        <section className="product-detail-hero">
          <div className="product-detail-gallery-shell">
            <ProductGallery productName={product.name} image={product.image || '/mlam-mark-3d-green-512.png'} galleryImages={galleryImages} />
            <span className={`product-detail-status ${available ? 'available' : 'coming'}`}>{available ? 'Available now' : 'Coming soon'}</span>
          </div>
          <div className="product-detail-copy">
            <span className="product-detail-kicker">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="pp-lead"><ProductDescription product={descriptionProduct} /></div>
            {chips.length > 0 && (
              <ul className="pp-chips">
                {chips.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
              </ul>
            )}
            <div className="product-detail-price-row">
              {price ? <strong>{price}</strong> : <strong>Coming soon</strong>}
              {purchasable && <span>One-time payment · Lifetime license</span>}
              {!available && price && <span>Expected price at launch</span>}
            </div>
            {!available && <div id="notify"><NotifyForm productId={product.id} productName={product.name} /></div>}
            <div className="product-detail-actions">
              {purchasable ? (
                <Link className="product-detail-buy" href={checkoutHref}>Buy now <span aria-hidden="true">→</span></Link>
              ) : (
                <a className="product-detail-buy" href={notifyHref}>Notify me when it launches</a>
              )}
              {demo && <a className="product-detail-demo" href={`/api/demos/${demo.id}/download`}>Try free demo <span aria-hidden="true">↓</span></a>}
            </div>
          </div>
        </section>

        <section className="pp-section" aria-labelledby="pp-how">
          <h2 id="pp-how" className="pp-heading">{steps ? 'How it works' : 'Highlights'}</h2>
          <ol className="pp-steps">
            {(steps ?? features.slice(0, 3).map((feature) => ({ title: feature, text: '' }))).map((step, index) => (
              <li key={step.title}>
                <span className="pp-step-num">{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.title}</strong>
                {step.text && <p>{step.text}</p>}
              </li>
            ))}
          </ol>
        </section>

        <div className="pp-split">
          <section className="pp-section pp-card" aria-labelledby="pp-watch">
            <h2 id="pp-watch" className="pp-heading">Watch it in action</h2>
            <Link className="pp-video" href="/tutorials">
              <img src={product.image || '/mlam-mark-3d-green-512.png'} alt="" loading="lazy" />
              <span className="pp-video-play" aria-hidden="true">
                <svg width="60" height="42" viewBox="0 0 28 20"><path fill="#ff0000" d="M27.4 3.1A3.5 3.5 0 0 0 24.9.6C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9a3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5c.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9z" /><path fill="#ffffff" d="M11.2 14.3 18.4 10l-7.2-4.3z" /></svg>
              </span>
            </Link>
            <p className="pp-muted">
              {guideCount?.n ? `${guideCount.n} video guide${guideCount.n === 1 ? '' : 's'} for ${product.name}.` : `Video guides for ${product.name} are coming to the MLAM YouTube channel.`}{' '}
              <Link href="/tutorials">Open How to use →</Link>
            </p>
          </section>

          {isPlugin && (
            <section className="pp-section pp-card" aria-labelledby="pp-specs">
              <h2 id="pp-specs" className="pp-heading">Specs</h2>
              <dl className="pp-specs">
                <div><dt>Format</dt><dd>VST3 (64-bit)</dd></div>
                <div><dt>Platform</dt><dd>Windows</dd></div>
                <div><dt>Works in</dt><dd>FL Studio, Ableton Live, Cubase, Studio One, Reaper, Bitwig</dd></div>
                <div><dt>License</dt><dd>One-time purchase, lifetime license</dd></div>
                <div><dt>Delivery</dt><dd>Download with your MLAM license key</dd></div>
              </dl>
            </section>
          )}
        </div>

        <section className="pp-section" aria-labelledby="pp-details">
          <h2 id="pp-details" className="pp-heading">Details</h2>
          <div className="product-detail-information">
            <details className="product-detail-accordion">
              <summary>What’s included</summary>
              {features.length ? <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : <p>Product information will be added soon.</p>}
              {demo?.notes && <p className="product-detail-demo-notes"><strong>About the demo:</strong> {demo.notes}</p>}
            </details>
            <details className="product-detail-accordion">
              <summary>License &amp; downloads</summary>
              <p>This is a digital product. Your license key and downloads are provided after purchase. Enter the key on the <Link href="/downloads">Downloads</Link> page to get the installer.</p>
            </details>
            <details className="product-detail-accordion">
              <summary>Support</summary>
              <p>Need help choosing or setting up this product? <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Question about ${product.name}`)}`}>Contact MLAM support</a>.</p>
            </details>
          </div>
        </section>

        {related.length > 0 && (
          <section className="pp-section" aria-labelledby="pp-more">
            <h2 id="pp-more" className="pp-heading">More from MLAM</h2>
            <RelatedProducts products={related} />
          </section>
        )}
      </main>
      <StickyBuyBar
        name={product.name}
        price={price || 'Coming soon'}
        href={purchasable ? checkoutHref : notifyHref}
        label={purchasable ? 'Buy now' : 'Notify me'}
      />
      <ModernFooter />
    </div>
  );
}
