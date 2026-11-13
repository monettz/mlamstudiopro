"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import type { ProductCardProduct } from "@/components/ui/product-card";

type Props = {
  product: ProductCardProduct;
  videoId: string;
  videoTitle: string;
  demoId?: string;
  kicker: string;
  title: string;
  onBuy: () => void;
};

function featureLine(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 2).join(" · ") : "";
  } catch { return ""; }
}

// Featured Release, "Split" card: one dark card holding the heading, a
// YouTube tutorial that plays in place (left) and the product panel (right).
// The YouTube player only loads after a click, so the homepage stays light.
export default function FeaturedRelease({ product, videoId, videoTitle, demoId, kicker, title, onBuy }: Props) {
  const [playing, setPlaying] = useState(false);
  const available = product.status === "published";
  const price = product.price_cents > 0 ? `$${(product.price_cents / 100).toFixed(0)}` : null;
  const href = `/plugins/${encodeURIComponent(product.slug || product.id)}`;
  const poster = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : product.image || "/logo-mark-black-512.png";
  const subline = featureLine(product.features) || product.category;

  return (
    <div className="fr-card">
      <div className="fr-kicker">{kicker}</div>
      <h2 className="fr-title">{title}</h2>

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
                <span className="fr-play" aria-hidden="true"><Play size={22} fill="currentColor" /></span>
              ) : (
                <span className="fr-soon">Tutorial coming soon</span>
              )}
              <span className="fr-progress" aria-hidden="true"><i /></span>
            </button>
          )}
        </div>

        <aside className="fr-product" aria-label={product.name}>
          <img className="fr-product-art" src={product.image || "/logo-mark-black-512.png"} alt="" width={420} height={140} loading="lazy" />
          <h3 className="fr-product-name">{product.name}</h3>
          <p className="fr-product-sub">{subline}</p>
          {price && <p className="fr-product-price">{price}</p>}
          <div className="fr-product-actions">
            {available ? (
              <button type="button" className="fr-btn primary" onClick={onBuy}>Buy now</button>
            ) : (
              <Link className="fr-btn primary" href={href}>View details</Link>
            )}
            {demoId ? (
              <a className="fr-btn ghost" href={`/api/demos/${demoId}/download`}>Try demo</a>
            ) : (
              <Link className="fr-btn ghost" href={href}>Details</Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
