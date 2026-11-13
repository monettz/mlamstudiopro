"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import ProductDescription from "@/app/product-description";
import type { ProductCardProduct } from "@/components/ui/product-card";

type Props = {
  product: ProductCardProduct;
  demoId?: string;
  onBuy: () => void;
};

// "Tools with a pulse" bento grid. Products you can buy get a large card with
// the full artwork, description, price and actions; coming-soon products get a
// compact card (thumbnail + name + status) that opens the product page.
export default function BentoCard({ product, demoId, onBuy }: Props) {
  const available = product.status === "published";
  const href = `/plugins/${encodeURIComponent(product.slug || product.id)}`;
  const image = product.image || "/logo-mark-black-512.png";
  const price = product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(0)}` : null;

  if (!available) {
    return (
      <Link className="bento-card bento-small" href={href}>
        <img className="bento-thumb" src={image} alt="" width={160} height={100} loading="lazy" />
        <span className="bento-small-body">
          <span className="bento-name">{product.name}</span>
          <span className="bento-category">{product.category}</span>
          <span className="bento-status">Coming soon</span>
        </span>
      </Link>
    );
  }

  return (
    <article className="bento-card bento-large">
      <Link className="bento-art" href={href} aria-label={product.name}>
        <img src={image} alt="" width={800} height={500} loading="lazy" />
      </Link>
      <div className="bento-large-body">
        <span className="bento-status is-live">Available now</span>
        <h3 className="bento-name bento-name-large"><Link href={href}>{product.name}</Link></h3>
        <div className="bento-desc"><ProductDescription product={product} /></div>
        <div className="bento-footer">
          {price && <span className="bento-price">{price}<small> USD</small></span>}
          <span className="bento-actions">
            <button type="button" className="bento-btn primary" onClick={onBuy}>Buy now</button>
            {demoId && (
              <a className="bento-btn ghost" href={`/api/demos/${demoId}/download`}><Download size={14} aria-hidden="true" /> Try demo</a>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
