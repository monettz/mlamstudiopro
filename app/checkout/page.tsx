import { database, ensureStore, type Product } from '@/lib/store';
import CheckoutForm from './checkout-form';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  await ensureStore();
  const { product: id } = await searchParams;
  const product = id
    ? await database().prepare("SELECT * FROM products WHERE id=? AND status='published'").bind(id).first<Product>()
    : null;

  return (
    <div className="subpage-wrapper">
      <ModernNav activeTab="plugins" />
      <main className="checkout-page">
        <section className="download-panel checkout-card-panel">
          <span className="showcase-kicker">DIRECT PURCHASE</span>

          {product ? (
            <>
              <div className="checkout-product-preview">
                <img className="checkout-art" src={product.image} alt={product.name} />
                <div className="checkout-preview-info">
                  <h1 className="subpage-title">{product.name}</h1>
                  <p className="checkout-price-tag">
                    Full Lifetime License · <strong>${(product.price_cents / 100).toFixed(2)} USD</strong>
                  </p>
                </div>
              </div>

              <CheckoutForm productId={product.id} />

              <div className="checkout-pending">
                <h2>Direct checkout is being finalized.</h2>
                <p>
                  M-Pesa and Visa / Mastercard checkout integration is currently connected in staging. To purchase right now or arrange direct activation:
                </p>
                <div className="payment-methods">
                  <span>M-Pesa Express</span>
                  <span>Visa / Mastercard</span>
                </div>
                <a
                  className="download-submit-btn"
                  href={`mailto:melaninentertainment255@gmail.com?subject=${encodeURIComponent(`Purchase inquiry: ${product.name}`)}`}
                  style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '14px' }}
                >
                  Order via Direct Email →
                </a>
              </div>
            </>
          ) : (
            <div className="checkout-empty">
              <h1 className="subpage-title">Product not available</h1>
              <p className="subpage-subtitle">Please select a published product from our catalog.</p>
              <a className="download-submit-btn" href="/#plugins" style={{ textDecoration: 'none' }}>
                Browse Plugins
              </a>
            </div>
          )}
        </section>
      </main>
      <ModernFooter />
    </div>
  );
}

