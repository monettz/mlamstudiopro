"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Play } from "lucide-react";
import ProductDescription from "@/app/product-description";
import type { ProductCardProduct } from "@/components/ui/product-card";

type Props = {
  product: ProductCardProduct;
  videoId: string;
  videoTitle: string;
  demoId?: string;
  buyLabel: string;
  demoLabel: string;
  detailsLabel: string;
  onBuy: () => void;
};

// Featured Release, "Split" layout: a YouTube tutorial on the left that plays
// in place, and the product it teaches on the right. The YouTube player only
// loads after a click, so the homepage stays light until someone wants it.
export default function FeaturedRelease({ product, videoId, videoTitle, demoId, buyLabel, demoLabel, detailsLabel, onBuy }: Props) {
  const [playing, setPlaying] = useState(false);
  const available = product.status === "published";
  const price = product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(0)}` : null;
  const href = `/plugins/${encodeURIComponent(product.slug || product.id)}`;
  const poster = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : product.image || "/logo-mark-black-512.png";

  return (
    <div className="fr-split">
      <div className="fr-video">
        {playing && videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={videoTitle}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="fr-video-poster"
            onClick={() => videoId && setPlaying(true)}
            aria-label={videoId ? `Play: ${videoTitle}` : `${videoTitle} (coming soon)`}
            disabled={!videoId}
          >
            <img src={poster} alt="" width={480} height={270} loading="lazy" />
            <span className="fr-video-caption">{videoTitle}</span>
            {videoId ? (
              <span className="fr-play" aria-hidden="true"><Play size={26} fill="currentColor" /></span>
            ) : (
              <span className="fr-soon">Tutorial coming soon</span>
            )}
          </button>
        )}
      </div>

      <aside className="fr-product" aria-label={product.name}>
        <img className="fr-product-art" src={product.image || "/logo-mark-black-512.png"} alt="" width={420} height={260} loading="lazy" />
        <div className="fr-product-head">
          <h3 className="fr-product-name">{product.name}</h3>
          <span className="fr-product-status">{available ? "Available now" : "Coming soon"}</span>
        </div>
        <div className="fr-product-desc"><ProductDescription product={product} /></div>
        {price && (
          <p className="fr-product-price"><strong>{price}</strong> <span>USD · Lifetime license</span></p>
        )}
        <div className="fr-product-actions">
          {available ? (
            <button type="button" className="fr-btn primary" onClick={onBuy}>{buyLabel}</button>
          ) : (
            <Link className="fr-btn primary" href={href}>{detailsLabel}</Link>
          )}
          {demoId ? (
            <a className="fr-btn ghost" href={`/api/demos/${demoId}/download`}><Download size={15} aria-hidden="true" /> {demoLabel}</a>
          ) : (
            <Link className="fr-btn ghost" href={href}>{detailsLabel}</Link>
          )}
        </div>
      </aside>
    </div>
  );
}
