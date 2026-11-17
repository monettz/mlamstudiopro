"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroItem } from "@/lib/homepage-media";
import { HERO_IMAGE_SECONDS } from "@/lib/homepage-media";

// The homepage hero background, set in Admin > Homepage. Several items play as
// a slideshow: images stay 6 seconds, videos play once (they are at most 6 s),
// then the next fades in. One video loops. With nothing uploaded the built-in
// video plays. Reduced motion shows the first item without moving.
export default function HeroMedia({ items, fallbackVideo }: { items: HeroItem[]; fallbackVideo: string }) {
  const [index, setIndex] = useState(0);
  const [still, setStill] = useState(false);
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});
  const slides = items.length ? items : [{ id: "built-in", kind: "video" as const, src: fallbackVideo }];
  const single = slides.length === 1;
  const current = slides[index % slides.length];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Images advance on a timer; videos advance when they end.
  useEffect(() => {
    if (single || still || current.kind !== "image") return;
    const timer = window.setTimeout(() => setIndex(i => (i + 1) % slides.length), HERO_IMAGE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [current, single, still, slides.length]);

  useEffect(() => {
    if (current.kind !== "video") return;
    const video = videos.current[current.id];
    if (!video) return;
    if (still) { video.pause(); return; }
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [current, still]);

  const next = slides[(index + 1) % slides.length];
  return <div className="hero-media" aria-hidden="true">
    {slides.map((item, i) => {
      const active = i === index % slides.length;
      // Only the current and the next slide load, so phones download little.
      const load = active || item.id === next.id;
      return item.kind === "image"
        ? <img key={item.id} className={`hero-bg-video hero-slide${active ? " is-active" : ""}`} src={load ? item.src : undefined} alt="" decoding="async" />
        : <video
            key={item.id}
            ref={element => { videos.current[item.id] = element; }}
            className={`hero-bg-video hero-slide${active ? " is-active" : ""}`}
            src={load ? item.src : undefined}
            muted playsInline
            autoPlay={active && !still}
            loop={single}
            preload={active ? "auto" : "metadata"}
            onEnded={() => { if (!single) setIndex(n => (n + 1) % slides.length); }}
          />;
    })}
  </div>;
}
