"use client";

import { useEffect, useState } from "react";

import ModernNav from "@/components/ui/modern-nav";
import ModernFooter from "@/components/ui/modern-footer";

type Tutorial = { id: string; product_id: string | null; product_name: string | null; product_image: string | null; title: string; description: string };

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const load = () => {
    setLoading(true); setError(false);
    fetch("/api/tutorials").then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { tutorials: Tutorial[] };
      setTutorials(data.tutorials ?? []);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  const names = Array.from(new Map(tutorials.filter(item => item.product_id).map(item => [item.product_id!, item.product_name ?? "Product"])).entries());
  const visible = filter === "all" ? tutorials : tutorials.filter(item => item.product_id === filter);
  return (
    <div className="subpage-wrapper">
      <ModernNav activeTab="guides" />
      <main className="tutorial-page">
        <section className="tutorial-library">
          <div className="tutorial-header">
            <span className="showcase-kicker">LEARN WITH MLAM</span>
            <h1 className="subpage-title">How to use.<br /><em>Watch. Create.</em></h1>
            <p className="subpage-subtitle">Master your instruments and effects with original walkthroughs and tips directly from MLAM.</p>
          </div>

          {!!names.length && (
            <div className="tutorial-filter-bar">
              <span className="filter-label">Filter:</span>
              <button
                className={`tutorial-pill-filter ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All guides
              </button>
              {names.map(([id, name]) => (
                <button
                  key={id}
                  className={`tutorial-pill-filter ${filter === id ? "active" : ""}`}
                  onClick={() => setFilter(id)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="tutorial-loading">
              <span className="spotlight-live-led" />
              <span>Loading video guides…</span>
            </div>
          ) : error ? (
            <div className="tutorial-empty">
              <h2>Videos could not load</h2>
              <p>Please check your connection and try again.</p>
              <button className="download-submit-btn" onClick={load}>Retry</button>
            </div>
          ) : !tutorials.length ? (
            <div className="tutorial-empty">
              <div className="tutorial-empty-icon" aria-hidden="true">▶</div>
              <h2>Video guides are on their way.</h2>
              <p>Published tutorials will appear here as soon as MLAM uploads them.</p>
              <a className="download-submit-btn" href="/#plugins">Explore plugins</a>
            </div>
          ) : (
            <div className="tutorial-grid">
              {visible.map(item => (
                <article className="tutorial-card" key={item.id}>
                  <div className="tutorial-video-wrap">
                    <video controls playsInline preload="metadata" poster={item.product_image ?? undefined} aria-label={item.title}>
                      <source src={`/api/tutorials/${item.id}/video`} />
                      Your browser does not support video playback.
                    </video>
                  </div>
                  <div className="tutorial-card-body">
                    <span className="tutorial-tag">{item.product_name ?? "MLAM Guide"}</span>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <ModernFooter />
    </div>
  );
}
