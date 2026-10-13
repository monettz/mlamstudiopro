"use client";

import { useEffect, useState } from "react";

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
  return <main className="tutorial-page">
    <header className="site-header"><a className="brand" href="/"><img src="/mlam-logo.png" alt="MLAM"/><span><b>MLAM</b> STUDIO PRO<small>HOW TO USE</small></span></a><nav><a href="/">Plugin store</a><a href="/downloads">Downloads</a><a href="/#support">Support</a></nav></header>
    <section className="tutorial-library"><span className="kicker">LEARN WITH MLAM</span><h1>How to use.<br/><em>Watch. Create.</em></h1><p>Learn how to use MLAM products with video guides from the creator.</p>
      {!!names.length && <label className="tutorial-filter">Choose product<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All guides</option>{names.map(([id,name]) => <option value={id} key={id}>{name}</option>)}</select></label>}
      {loading ? <p role="status">Loading video guides…</p> : error ? <div className="tutorial-empty"><h2>Videos could not load</h2><p>Please try again.</p><button className="button ghost" onClick={load}>Retry</button></div> : !tutorials.length ? <div className="tutorial-empty"><span aria-hidden="true">▶</span><h2>Video guides are on their way.</h2><p>Published tutorials will appear here as soon as MLAM uploads them.</p><a className="button ghost" href="/">Explore plugins</a></div> : <div className="tutorial-grid">{visible.map(item => <article className="tutorial-card" key={item.id}><video controls playsInline preload="metadata" poster={item.product_image ?? undefined} aria-label={item.title}><source src={`/api/tutorials/${item.id}/video`}/>Your browser does not support video playback.</video><div><span className="kicker">{item.product_name ?? "MLAM guide"}</span><h2>{item.title}</h2><p>{item.description}</p></div></article>)}</div>}
    </section>
  </main>;
}
