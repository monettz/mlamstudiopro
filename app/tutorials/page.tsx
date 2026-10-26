"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import ModernNav from "@/components/ui/modern-nav";
import ModernFooter from "@/components/ui/modern-footer";

type Tutorial = { id: string; product_id: string | null; product_name: string | null; product_image: string | null; title: string; description: string };

// A guide is either an uploaded MP4/WEBM, a YouTube video, or a demo placeholder
// shown until MLAM publishes real videos.
type Guide = {
  id: string; title: string; description: string;
  productId: string | null; productName: string; image: string | null;
  videoSrc?: string; youtubeId?: string; demo?: boolean;
};

// Replace with the MLAM channel URL once it exists.
const YOUTUBE_CHANNEL = "https://www.youtube.com/";

const demoGuides: Guide[] = [
  { id: "demo-voice-start", demo: true, productId: "voice-midi", productName: "Voice MIDI", image: "/plugins/mlam-voice-midi.png", title: "Getting started with MLAM Voice MIDI", description: "Install the plugin, load it in your DAW and turn your first hum into editable MIDI." },
  { id: "demo-fl-install", demo: true, productId: null, productName: "Getting started", image: null, title: "Install MLAM plugins in FL Studio", description: "Where the VST3 file goes, how to rescan plugins and open MLAM tools in a project." },
  { id: "demo-voice-melody", demo: true, productId: "voice-midi", productName: "Voice MIDI", image: "/plugins/mlam-voice-midi.png", title: "Hum a melody, get clean MIDI", description: "Tips for clean pitch detection, scale-aware notes and quantizing the result." },
  { id: "demo-bass-presets", demo: true, productId: "bushman-bass", productName: "Bushman Bass", image: "/plugins/bushman-bass.png", title: "Bushman Bass: a tour of the presets", description: "Electric, slap, fretless and deep-sub sounds, and when to reach for each one." },
  { id: "demo-eq-vocals", demo: true, productId: "pro-eq", productName: "Pro EQ", image: null, title: "Mixing vocals with MLAM Pro EQ", description: "Clean up mud, add presence and use the realtime spectrum to hear what you change." },
  { id: "demo-stereo-forge", demo: true, productId: "stereo-imager", productName: "Stereo Forge", image: "/plugins/mlam-imager.svg", title: "Wider mixes with Stereo Forge", description: "Mid/side width, input and output gain, and keeping the low end mono." },
];

function fromTutorial(item: Tutorial): Guide {
  return {
    id: item.id, title: item.title, description: item.description,
    productId: item.product_id, productName: item.product_name ?? "MLAM Guide", image: item.product_image,
    videoSrc: `/api/tutorials/${item.id}/video`,
  };
}

function thumbnailFor(guide: Guide) {
  return guide.youtubeId ? `https://i.ytimg.com/vi/${guide.youtubeId}/hqdefault.jpg` : guide.image;
}

function YouTubeLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 28 20" aria-hidden="true">
      <path fill="#ff0000" d="M27.4 3.1A3.5 3.5 0 0 0 24.9.6C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9a3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5c.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9z" />
      <path fill="#ffffff" d="M11.2 14.3 18.4 10l-7.2-4.3z" />
    </svg>
  );
}

function Thumbnail({ guide, large = false }: { guide: Guide; large?: boolean }) {
  const src = thumbnailFor(guide);
  return (
    <span className={`tut-thumb${large ? " is-large" : ""}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <span className="tut-thumb-placeholder">
          <img src="/mlam-mark-3d-green-512.png" alt="" />
        </span>
      )}
      <span className="tut-thumb-tag">{guide.productName}</span>
      {guide.demo && <span className="tut-thumb-soon">Coming soon</span>}
      <span className="tut-thumb-play"><YouTubeLogo size={large ? 68 : 52} /></span>
    </span>
  );
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<Guide | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch("/api/tutorials").then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { tutorials: Tutorial[] };
      setTutorials(data.tutorials ?? []);
    }).catch(() => setTutorials([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [active]);

  const guides = tutorials.length ? tutorials.map(fromTutorial) : demoGuides;
  const names = Array.from(new Set(guides.map(guide => guide.productName)));
  const visible = filter === "all" ? guides : guides.filter(guide => guide.productName === filter);
  const [featured, ...rest] = visible;

  return (
    <div className="subpage-wrapper">
      <ModernNav activeTab="guides" />
      <main className="tutorial-page">
        <section className="tut-library">
          <div className="tutorial-header">
            <span className="showcase-kicker">LEARN WITH MLAM</span>
            <h1 className="subpage-title">How to use.<br /><em>Watch. Create.</em></h1>
            <p className="subpage-subtitle">Master your instruments and effects with original walkthroughs and tips directly from MLAM.</p>
          </div>

          {loading ? (
            <div className="tutorial-loading">
              <span className="spotlight-live-led" />
              <span>Loading video guides…</span>
            </div>
          ) : (
            <>
              <div className="tut-filters" role="group" aria-label="Filter video guides">
                {["all", ...names].map(name => (
                  <button key={name} type="button" className={filter === name ? "active" : ""} aria-pressed={filter === name} onClick={() => setFilter(name)}>
                    {name === "all" ? "All guides" : name}
                  </button>
                ))}
              </div>

              {featured && (
                <article className="tut-featured">
                  <button type="button" className="tut-thumb-button" onClick={() => setActive(featured)} aria-label={`Play ${featured.title}`}>
                    <Thumbnail guide={featured} large />
                  </button>
                  <div className="tut-featured-info">
                    <span className="tut-eyebrow">{featured.demo ? "Coming soon" : "Latest guide"} · {featured.productName}</span>
                    <h2>{featured.title}</h2>
                    <p>{featured.description}</p>
                    <div className="tut-featured-actions">
                      <button type="button" className="tut-btn primary" onClick={() => setActive(featured)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z" /></svg>
                        Play video
                      </button>
                      {featured.productId && (
                        <Link className="tut-btn ghost" href={`/plugins/${encodeURIComponent(featured.productId)}`}>Get {featured.productName} →</Link>
                      )}
                    </div>
                  </div>
                </article>
              )}

              {!!rest.length && (
                <div className="tut-grid">
                  {rest.map(guide => (
                    <article className="tut-card" key={guide.id}>
                      <button type="button" className="tut-thumb-button" onClick={() => setActive(guide)} aria-label={`Play ${guide.title}`}>
                        <Thumbnail guide={guide} />
                      </button>
                      <div className="tut-card-body">
                        <span className="tut-eyebrow">{guide.productName}</span>
                        <h3>{guide.title}</h3>
                        <p>{guide.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <aside className="tut-channel">
                <YouTubeLogo size={44} />
                <div>
                  <h2>MLAM on YouTube</h2>
                  <p>New walkthroughs, sound demos and production tips. Subscribe to see them first.</p>
                </div>
                <a className="tut-btn youtube" href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">Subscribe on YouTube</a>
              </aside>
            </>
          )}
        </section>
      </main>
      <ModernFooter />

      {active && (
        <div className="tut-modal-backdrop" onClick={() => setActive(null)}>
          <div className="tut-modal" role="dialog" aria-modal="true" aria-label={active.title} onClick={event => event.stopPropagation()}>
            <button ref={closeRef} type="button" className="tut-modal-close" aria-label="Close video" onClick={() => setActive(null)}>×</button>
            <div className="tut-player">
              {active.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
                  title={active.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : active.videoSrc ? (
                <video controls autoPlay playsInline poster={active.image ?? undefined}>
                  <source src={active.videoSrc} />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="tut-player-soon">
                  <YouTubeLogo size={64} />
                  <strong>This video is coming soon</strong>
                  <span>It will be published on the MLAM YouTube channel and play right here.</span>
                  <a className="tut-btn youtube" href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">Subscribe on YouTube</a>
                </div>
              )}
            </div>
            <div className="tut-modal-info">
              <span className="tut-eyebrow">{active.productName}</span>
              <h2>{active.title}</h2>
              <p>{active.description}</p>
              <div className="tut-featured-actions">
                {active.youtubeId && (
                  <a className="tut-btn ghost" href={`https://www.youtube.com/watch?v=${active.youtubeId}`} target="_blank" rel="noopener noreferrer">
                    <YouTubeLogo size={20} /> Watch on YouTube
                  </a>
                )}
                {active.productId && (
                  <Link className="tut-btn ghost" href={`/plugins/${encodeURIComponent(active.productId)}`}>Get {active.productName} →</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
