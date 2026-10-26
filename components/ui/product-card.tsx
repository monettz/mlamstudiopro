"use client";

import Link from "next/link";
import { useLanguage } from "@/app/language-provider";
import ProductDescription from "@/app/product-description";

export type ProductCardProduct = {
  id: string; slug?: string; name: string; category: string; description: string;
  price_cents: number; status: string; image: string; features: string; checkout_url: string; description_translations?: string;
};

type Props = {
  product: ProductCardProduct;
  highlight: string;
  demoId?: string;
  onBuy: () => void;
  onNotify: () => void;
};

// The whole card links to the product page through a stretched title link;
// action buttons sit above that link so they keep their own behaviour.
export default function ProductCard({ product, highlight, demoId, onBuy, onNotify }: Props) {
  const { t } = useLanguage();
  const available = product.status === "published";
  const href = `/plugins/${encodeURIComponent(product.slug || product.id)}`;
  const price = product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(0)}` : null;

  return (
    <article className={`pcard ${available ? "is-available" : "is-soon"}`}>
      <div className="pcard-media">
        {product.image ? (
          <img src={product.image} alt="" loading="lazy" />
        ) : (
          <div className="pcard-placeholder" aria-hidden="true">
            <img src="/mlam-mark-3d-green-512.png" alt="" />
            <span>{product.category}</span>
          </div>
        )}
        <span className="pcard-category">{product.category}</span>
        <span className={`pcard-status ${available ? "published" : "coming-soon"}`}>
          {available ? t("available") : t("comingSoon")}
        </span>
      </div>

      <div className="pcard-body">
        <h3 className="pcard-title">
          <Link className="pcard-link" href={href}>{product.name}</Link>
        </h3>

        <div className="pcard-desc">
          <ProductDescription product={product} />
        </div>

        <p className="pcard-highlight">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{highlight}</span>
        </p>

        <div className="pcard-footer">
          <div className="pcard-actions">
            {available ? (
              <>
                <button className="pcard-btn primary" type="button" onClick={onBuy}>{t("buy")}</button>
                {demoId && (
                  <a className="pcard-btn ghost" href={`/api/demos/${demoId}/download`}>{t("tryDemo")} ↓</a>
                )}
              </>
            ) : (
              <button className="pcard-btn ghost" type="button" onClick={onNotify}>{t("notify")}</button>
            )}
          </div>

          {available ? (
            <div className="pcard-price">
              <strong>{price ?? "Free"}</strong>
              {price && <small>USD</small>}
            </div>
          ) : price && (
            <div className="pcard-price is-muted">
              <strong>{price}</strong>
              <small>{t("comingSoon")}</small>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
