import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { database, ensureStore, type Product } from '@/lib/store';
import ProductDescription from '@/app/product-description';
import ProductGallery from './product-gallery';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';

type PageProps = { params: Promise<{ slug: string }> };
type Demo = { id: string; version: string; notes: string };

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
  const available = product.status === 'published';
  // node:sqlite rows have a null prototype; rebuild the client prop as a plain object.
  const descriptionProduct = {
    id: product.id,
    description: product.description,
    description_translations: product.description_translations,
  };

  return (
    <div className="subpage-wrapper product-page-wrapper">
      <ModernNav activeTab="plugins" />
      <main className="product-detail-page">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link href="/#plugins">Plugins</Link><span aria-hidden="true">/</span><span>{product.name}</span>
        </nav>

        <section className="product-detail-hero">
          <div className="product-detail-gallery-shell">
            <ProductGallery productName={product.name} image={product.image || '/plugins/mlam-voice-midi.png'} galleryImages={galleryImages} />
            <span className={`product-detail-status ${available ? 'available' : 'coming'}`}>{available ? 'Available now' : 'Coming soon'}</span>
          </div>
          <div className="product-detail-copy">
            <span className="product-detail-kicker">{product.category}</span>
            <h1>{product.name}</h1>
            {features.length > 0 && <ul className="product-detail-highlights">{features.slice(0, 4).map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>}
            <div className="product-detail-price-row">
              <strong>{product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(2)} USD` : 'Coming soon'}</strong>
              {available && product.price_cents > 0 && <span>Lifetime license</span>}
            </div>
            <div className="product-detail-actions">
              {available && product.price_cents > 0 ? (
                <Link className="product-detail-buy" href={`/checkout?product=${encodeURIComponent(product.id)}`}>Continue to checkout <span aria-hidden="true">→</span></Link>
              ) : (
                <span className="product-detail-unavailable">This product is not available to purchase yet.</span>
              )}
              {demo && <a className="product-detail-demo" href={`/api/demos/${demo.id}/download`}>Download free demo <span aria-hidden="true">↓</span></a>}
            </div>
            <p className="product-detail-checkout-note">Checkout is being prepared. No payment is taken until mobile money and card payments are enabled.</p>
            <div className="product-detail-information">
              <div className="product-detail-description-block">
                <h2>Description</h2>
                <div className="product-detail-description"><ProductDescription product={descriptionProduct} /></div>
              </div>
              <details className="product-detail-accordion">
                <summary>What’s included</summary>
                {features.length ? <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : <p>Product information will be added soon.</p>}
                {demo?.notes && <p className="product-detail-demo-notes"><strong>About the demo:</strong> {demo.notes}</p>}
              </details>
              <details className="product-detail-accordion">
                <summary>License &amp; downloads</summary>
                <p>This is a digital product. Your license and available downloads are provided after purchase.</p>
              </details>
              <details className="product-detail-accordion">
                <summary>Support</summary>
                <p>Need help choosing or setting up this product? <a href={`mailto:melaninentertainment255@gmail.com?subject=${encodeURIComponent(`Question about ${product.name}`)}`}>Contact MLAM support</a>.</p>
              </details>
            </div>
          </div>
        </section>
      </main>
      <ModernFooter />
    </div>
  );
}
