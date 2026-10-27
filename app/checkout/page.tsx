import Link from 'next/link';
import { Check } from 'lucide-react';
import { database, ensureStore, type Product } from '@/lib/store';
import CheckoutForm from './checkout-form';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  await ensureStore();
  const { product: id } = await searchParams;
  const product = id
    ? await database().prepare("SELECT * FROM products WHERE id=? AND status='published' AND price_cents>0").bind(id).first<Product>()
    : null;
  const priceLabel = product ? `$${(product.price_cents / 100).toFixed(2)} USD` : '';

  return (
    <div className="subpage-wrapper">
      <ModernNav activeTab="plugins" />
      <main className="checkout-page checkout-page-modern">
        {product ? (
          <section className="checkout-layout" aria-labelledby="checkout-title">
            <div className="checkout-main-panel">
              <Link className="checkout-back" href={`/plugins/${encodeURIComponent(product.slug || product.id)}`}>← Back to {product.name}</Link>
              <h1 id="checkout-title" className="checkout-title">Checkout</h1>
              <p className="checkout-intro">Two quick steps: your details, then how you want to pay.</p>

              {/* Phones get a one-line order summary that expands; the full card is hidden there. */}
              <details className="checkout-mobile-summary">
                <summary>
                  <img src={product.image || '/plugins/mlam-voice-midi.png'} alt="" />
                  <span className="checkout-mobile-summary-name">{product.name}</span>
                  <strong>{priceLabel}</strong>
                </summary>
                <div className="checkout-summary-lines">
                  <div><span>Subtotal</span><strong>{priceLabel}</strong></div>
                  <div><span>Delivery</span><strong>Digital download</strong></div>
                  <div className="checkout-summary-total"><span>Total</span><strong>{priceLabel}</strong></div>
                </div>
                <ul className="checkout-summary-promise">
                  <li><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>One-time purchase, no recurring charge</li>
                  <li><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>License key and downloads after payment</li>
                </ul>
              </details>

              <CheckoutForm productId={product.id} priceLabel={priceLabel} />
            </div>

            <aside className="checkout-summary" aria-label="Order summary">
              <span className="checkout-summary-label">YOUR ORDER</span>
              <div className="checkout-summary-product">
                <img className="checkout-art" src={product.image || '/plugins/mlam-voice-midi.png'} alt="" />
                <div><h2 className="checkout-product-title">{product.name}</h2><span>Digital product · Lifetime license</span></div>
              </div>
              <div className="checkout-summary-lines">
                <div><span>Subtotal</span><strong>{priceLabel}</strong></div>
                <div><span>Delivery</span><strong>Digital download</strong></div>
                <div className="checkout-summary-total"><span>Total</span><strong>{priceLabel}</strong></div>
              </div>
              <ul className="checkout-summary-promise">
                <li><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>One-time purchase, no recurring charge</li>
                <li><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>License key and downloads after payment</li>
                <li><span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>Card number is never stored by MLAM</li>
              </ul>
              <Link className="checkout-summary-continue" href={`/plugins/${encodeURIComponent(product.slug || product.id)}`}>Review product details</Link>
            </aside>
          </section>
        ) : (
          <section className="checkout-empty download-panel">
            <span className="showcase-kicker">CHECKOUT</span>
            <h1 className="subpage-title">Product not available</h1>
            <p className="subpage-subtitle">Please choose an available product from the catalog.</p>
            <Link className="download-submit-btn" href="/#plugins">Browse products</Link>
          </section>
        )}
      </main>
      <ModernFooter />
    </div>
  );
}
