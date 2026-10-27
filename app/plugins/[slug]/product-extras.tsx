'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard, { type ProductCardProduct } from '@/components/ui/product-card';

function featureList(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

// "More from MLAM": the storefront's ProductCard needs click handlers, so it
// lives in this client component rather than the server page.
export function RelatedProducts({ products }: { products: ProductCardProduct[] }) {
  const router = useRouter();
  return (
    <div className="product-grid pp-related-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          highlight={featureList(product.features)[0] || product.category}
          onBuy={() => router.push(`/checkout?product=${encodeURIComponent(product.id)}`)}
          onNotify={() => router.push(`/plugins/${encodeURIComponent(product.slug || product.id)}`)}
        />
      ))}
    </div>
  );
}

// Phone-only bar with the price and main action. It hides while the hero's own
// buttons are on screen so the two never show at once.
export function StickyBuyBar({ name, price, href, label }: { name: string; price: string; href: string; label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector('.product-detail-actions');
    if (!target) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`pp-sticky${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <div className="pp-sticky-info">
        <span>{name}</span>
        <strong>{price}</strong>
      </div>
      <a className="pp-sticky-btn" href={href} tabIndex={visible ? 0 : -1}>{label}</a>
    </div>
  );
}
