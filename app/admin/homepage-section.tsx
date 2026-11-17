"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Trash2, MonitorPlay, Upload } from "lucide-react";
import { HERO_VIDEO_TOLERANCE_MS, MAX_HERO_IMAGE_BYTES, MAX_HERO_ITEMS, MAX_HERO_VIDEO_BYTES, MAX_HERO_VIDEO_MS, MAX_PLAYLIST_ITEMS } from "@/lib/homepage-media";
import { uploadProductImage } from "./product-drawer";

type HeroRow = { id:string; kind:"image"|"video"; src:string; file_name:string; file_size:number; duration_ms:number; is_active:number };
type PlaylistRow = { id:string; image:string; song:string; artist:string; producer:string; plugin:string; url:string; is_active:number };
type Data = { hero:HeroRow[]; playlist:PlaylistRow[]; featured:{ id:string; name:string; image:string; status:string; video_id:string; featured_text:string } | null };

const mb = (bytes:number) => `${(bytes / 1048576).toFixed(1)} MB`;

async function send(url:string, method:string, body?:unknown) {
  const response = await fetch(url, { method, headers: body === undefined ? undefined : { "Content-Type":"application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => ({})) as { error?:string };
  if (!response.ok) throw new Error(result.error ?? "Could not save");
  return result;
}

// Reads a video's length in the browser so a long clip is refused before it uploads.
function videoSeconds(file:File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata"; video.muted = true;
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This video could not be read. Use an MP4 or WEBM file.")); };
    video.src = url;
  });
}

export default function HomepageSection({ flash, onOpenProduct }:{ flash:(text:string)=>void; onOpenProduct:(id:string)=>void }) {
  const [data,setData] = useState<Data|null>(null);
  const [error,setError] = useState("");
  const load = useCallback(async () => {
    try { const response = await fetch("/api/homepage"); if (!response.ok) throw new Error(); setData(await response.json() as Data); }
    catch { setError("Homepage content could not be loaded. Refresh the page."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function act(work:()=>Promise<unknown>, done:string) {
    try { await work(); await load(); flash(done); }
    catch (problem) { flash(problem instanceof Error ? problem.message : "Could not save"); }
  }

  if (!data) return <div className="admin-card">{error ? <p className="admin-error" role="alert">{error}</p> : <p className="admin-hint">Loading homepage content…</p>}</div>;
  return <div className="hp-sections">
    <HeroCard items={data.hero} act={act} onUploaded={async text => { await load(); flash(text); }}/>
    <FeaturedCard featured={data.featured} onOpenProduct={onOpenProduct}/>
    <PlaylistCard items={data.playlist} act={act} onAdded={async text => { await load(); flash(text); }}/>
  </div>;
}

function HeroCard({ items, act, onUploaded }:{ items:HeroRow[]; act:(work:()=>Promise<unknown>, done:string)=>Promise<void>; onUploaded:(text:string)=>Promise<void> }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const full = items.length >= MAX_HERO_ITEMS;

  async function upload(file:File) {
    setError("");
    const isVideo = file.type.startsWith("video/");
    if (isVideo && file.size > MAX_HERO_VIDEO_BYTES) { setError("Videos must be 15 MB or smaller."); return; }
    if (!isVideo && file.size > MAX_HERO_IMAGE_BYTES) { setError("Images must be 8 MB or smaller."); return; }
    setBusy(true);
    try {
      if (isVideo) {
        const seconds = await videoSeconds(file);
        if (seconds * 1000 > MAX_HERO_VIDEO_MS + HERO_VIDEO_TOLERANCE_MS) throw new Error(`This video is ${seconds.toFixed(1)} seconds long. Hero videos can be at most 6 seconds.`);
      }
      const form = new FormData(); form.set("file", file);
      const response = await fetch("/api/hero-media", { method:"POST", body:form });
      const result = await response.json().catch(() => ({})) as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed");
      await onUploaded(isVideo ? "Video added to the hero" : "Image added to the hero");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  return <section className="admin-card hp-card" aria-labelledby="hp-hero-title">
    <div className="adm-card-head"><h2 id="hp-hero-title">Hero slideshow</h2><span className="adm-muted">{items.length} of {MAX_HERO_ITEMS}</span></div>
    <p className="admin-hint">The big picture at the top of the homepage. Add images or videos of <strong>6 seconds or less</strong> (images up to 8 MB, videos up to 15 MB). With several, they take turns: each image shows for 6 seconds and each video plays once. {items.length ? "" : "Nothing added yet, so the homepage shows the built-in video, which is very large (40 MB) and slow on phones."}</p>
    <div className="hp-media-grid">
      {items.map((item, index) => <figure key={item.id} className={item.is_active ? "" : "is-hidden"}>
        <div className="hp-media-frame">
          {item.kind === "video" ? <video src={item.src} muted loop playsInline autoPlay preload="metadata" aria-label={`Hero video ${index + 1}`}/> : <img src={item.src} alt={`Hero image ${index + 1}`}/>}
          <span className="hp-badge">{index + 1} · {item.kind === "video" ? `Video ${(item.duration_ms / 1000).toFixed(1)} s` : "Image"}{item.is_active ? "" : " · Hidden"}</span>
        </div>
        <figcaption>
          <small title={item.file_name}>{item.file_name || "Upload"} · {mb(item.file_size)}</small>
          <span className="hp-actions">
            <button type="button" aria-label="Move earlier" disabled={index === 0} onClick={() => void act(() => send(`/api/hero-media/${item.id}`, "PATCH", { move:"up" }), "Order changed")}><ArrowUp size={15} aria-hidden="true"/></button>
            <button type="button" aria-label="Move later" disabled={index === items.length - 1} onClick={() => void act(() => send(`/api/hero-media/${item.id}`, "PATCH", { move:"down" }), "Order changed")}><ArrowDown size={15} aria-hidden="true"/></button>
            <button type="button" onClick={() => void act(() => send(`/api/hero-media/${item.id}`, "PATCH", { active:!item.is_active }), item.is_active ? "Hidden from the homepage" : "Shown on the homepage")}>{item.is_active ? <><EyeOff size={15} aria-hidden="true"/> Hide</> : <><Eye size={15} aria-hidden="true"/> Show</>}</button>
            <button type="button" className="danger" aria-label={`Delete hero item ${index + 1}`} onClick={() => { if (window.confirm("Delete this from the hero? This cannot be undone.")) void act(() => send(`/api/hero-media/${item.id}`, "DELETE"), "Deleted from the hero"); }}><Trash2 size={15} aria-hidden="true"/></button>
          </span>
        </figcaption>
      </figure>)}
      {!full && <label className={`hp-add${busy ? " is-busy" : ""}`}>
        <Upload size={22} aria-hidden="true"/><strong>{busy ? "Uploading…" : "Add image or video"}</strong><small>JPG, PNG, WEBP · MP4, WEBM up to 6 s</small>
        <input type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }}/>
      </label>}
    </div>
    {full && <p className="admin-hint">The hero is full. Delete an item to add another.</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
  </section>;
}

// Featured Release is chosen per product (Products > a product > Details).
function FeaturedCard({ featured, onOpenProduct }:{ featured:Data["featured"]; onOpenProduct:(id:string)=>void }) {
  const hidden = featured && featured.status === "draft";
  return <section className="admin-card hp-card" aria-labelledby="hp-featured-title">
    <div className="adm-card-head"><h2 id="hp-featured-title">Featured Release</h2></div>
    <p className="admin-hint">The product shown under Featured Release, with its YouTube video. To change it, open a product in Products and tick <strong>Show this product in Featured Release</strong> in Details. Only one product is featured at a time.</p>
    {featured ? <div className="hp-featured-current">
      <div className="hp-featured-preview">{featured.video_id ? <img src={`https://i.ytimg.com/vi/${featured.video_id}/hqdefault.jpg`} alt={`${featured.name} video`}/> : featured.image ? <img src={featured.image} alt=""/> : <span><MonitorPlay size={28} aria-hidden="true"/>No video</span>}</div>
      <div className="hp-featured-info">
        <strong>{featured.name}</strong>
        <small>{featured.video_id ? "Has a YouTube video" : "No video yet: the section shows Coming soon"}</small>
        {hidden && <p className="admin-error" role="status">This product is a Draft, so the homepage shows Voice MIDI instead. Publish it or set it to Coming soon.</p>}
        <button type="button" className="button ghost" onClick={() => onOpenProduct(featured.id)}>Open in Products</button>
      </div>
    </div> : <p className="admin-hint">No product chosen, so the homepage shows Voice MIDI.</p>}
  </section>;
}

function PlaylistCard({ items, act, onAdded }:{ items:PlaylistRow[]; act:(work:()=>Promise<unknown>, done:string)=>Promise<void>; onAdded:(text:string)=>Promise<void> }) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const [editing,setEditing] = useState<string|null>(null);
  const full = items.length >= MAX_PLAYLIST_ITEMS;

  async function add(file:File) {
    setBusy(true); setError("");
    try { const image = await uploadProductImage(file); await send("/api/playlist", "POST", { image }); await onAdded("Photo added to the playlist wall"); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  return <section className="admin-card hp-card" aria-labelledby="hp-playlist-title">
    <div className="adm-card-head"><h2 id="hp-playlist-title">Playlist wall</h2><span className="adm-muted">{items.length} of {MAX_PLAYLIST_ITEMS}</span></div>
    <p className="admin-hint">“From our plugins to your playlist”. Square photos work best. Song, artist, producer and plugin are optional; add them only for songs whose artist agreed to be shown.</p>
    <div className="hp-photo-grid">
      {items.map((item, index) => <figure key={item.id} className={item.is_active ? "" : "is-hidden"}>
        <img src={item.image} alt={item.song || `Playlist photo ${index + 1}`}/>
        <figcaption>
          <small>{item.song ? `${item.song}${item.artist ? ` · ${item.artist}` : ""}` : "No caption"}{item.is_active ? "" : " · Hidden"}</small>
          <span className="hp-actions">
            <button type="button" aria-label="Move earlier" disabled={index === 0} onClick={() => void act(() => send(`/api/playlist/${item.id}`, "PATCH", { move:"up" }), "Order changed")}><ArrowUp size={14} aria-hidden="true"/></button>
            <button type="button" aria-label="Move later" disabled={index === items.length - 1} onClick={() => void act(() => send(`/api/playlist/${item.id}`, "PATCH", { move:"down" }), "Order changed")}><ArrowDown size={14} aria-hidden="true"/></button>
            <button type="button" aria-label={editing === item.id ? "Close caption" : "Edit caption"} aria-expanded={editing === item.id} onClick={() => setEditing(editing === item.id ? null : item.id)}><Pencil size={14} aria-hidden="true"/></button>
            <button type="button" aria-label={item.is_active ? "Hide photo" : "Show photo"} onClick={() => void act(() => send(`/api/playlist/${item.id}`, "PATCH", { active:!item.is_active }), item.is_active ? "Photo hidden" : "Photo shown")}>{item.is_active ? <EyeOff size={14} aria-hidden="true"/> : <Eye size={14} aria-hidden="true"/>}</button>
            <button type="button" className="danger" aria-label={`Delete photo ${index + 1}`} onClick={() => { if (window.confirm("Delete this photo from the wall?")) void act(() => send(`/api/playlist/${item.id}`, "DELETE"), "Photo deleted"); }}><Trash2 size={14} aria-hidden="true"/></button>
          </span>
          {editing === item.id && <CaptionForm item={item} onSave={values => act(async () => { await send(`/api/playlist/${item.id}`, "PATCH", values); setEditing(null); }, "Caption saved")}/>}
        </figcaption>
      </figure>)}
      {!full && <label className={`hp-add hp-add-square${busy ? " is-busy" : ""}`}>
        <ImagePlus size={22} aria-hidden="true"/><strong>{busy ? "Uploading…" : "Add photo"}</strong><small>JPG, PNG or WEBP</small>
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void add(file); }}/>
      </label>}
    </div>
    {error && <p className="admin-error" role="alert">{error}</p>}
  </section>;
}

function CaptionForm({ item, onSave }:{ item:PlaylistRow; onSave:(values:Record<string,string>)=>Promise<void> }) {
  const [values,setValues] = useState({ song:item.song, artist:item.artist, producer:item.producer, plugin:item.plugin, url:item.url });
  const [busy,setBusy] = useState(false);
  const field = (key:keyof typeof values, label:string, placeholder:string) => <label>{label}<input value={values[key]} maxLength={key === "url" ? 500 : 120} placeholder={placeholder} onChange={e=>setValues({ ...values, [key]:e.target.value })}/></label>;
  return <form className="admin-form hp-caption" onSubmit={async event => { event.preventDefault(); setBusy(true); try { await onSave(values); } finally { setBusy(false); } }}>
    <fieldset disabled={busy}>
      {field("song","Song","Song title")}
      {field("artist","Artist","Artist name")}
      {field("producer","Producer","Producer name")}
      {field("plugin","Plugin used","MLAM Voice MIDI")}
      {field("url","Song link","https://…")}
      <button className="button primary">{busy ? "Saving…" : "Save caption"}</button>
    </fieldset>
  </form>;
}
