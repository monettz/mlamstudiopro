"use client";

import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, ImagePlus, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { DescriptionFields } from "./description-editor";
import { builtInTranslations, readDescriptionTranslations, type DescriptionTranslations } from "@/lib/product-descriptions";
import { DEFAULT_SPECS, MAX_SPECS, MAX_STEPS, readSpecs, readSteps, type PageSpec, type PageStep } from "@/lib/product-page-content";
import { youtubeId } from "@/lib/homepage-media";

export type DrawerProduct = { id:string; slug:string; name:string; category:string; description:string; price_cents:number; status:string; image:string; features:string; checkout_url:string; gallery_images:string; description_translations?:string; page_steps?:string; page_specs?:string; video_id?:string; video_title?:string; featured_text?:string };
export type DrawerRelease = { id:string; product_id:string; version:string; file_name:string; file_size:number; is_active:number };
export type DrawerVideo = { id:string; product_id:string|null; title:string; file_size:number; is_published:number };

type Tab = "details" | "images" | "page" | "files" | "videos" | "translations";
const TABS: { id:Tab; label:string }[] = [
  { id:"details", label:"Details" }, { id:"images", label:"Images" }, { id:"page", label:"Page content" },
  { id:"files", label:"Files" }, { id:"videos", label:"Videos" }, { id:"translations", label:"Translations" },
];
// The product page shows four photos: the main image and up to three more.
const EXTRA_PHOTOS = 3;

const STATUS_OPTIONS: [string,string][] = [["published","Published (on sale)"],["coming-soon","Coming soon"],["draft","Draft (hidden)"]];
const toCents = (value:string) => { const amount = Number(value); return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : NaN; };
const list = (value:string) => { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((x):x is string => typeof x === "string") : []; } catch { return []; } };
const mb = (bytes:number) => `${(bytes / 1048576).toFixed(1)} MB`;

async function send(url:string, method:string, body:unknown) {
  const response = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) });
  const result = await response.json().catch(() => ({})) as { error?:string; id?:string };
  if (!response.ok) throw new Error(result.error ?? "Could not save");
  return result;
}

export async function uploadProductImage(file:File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller");
  const data = new FormData(); data.set("file", file);
  const response = await fetch("/api/product-images", { method:"POST", body:data });
  const result = await response.json() as { image?:string; error?:string };
  if (!response.ok || !result.image) throw new Error(result.error ?? "Image could not be uploaded");
  return result.image;
}

export default function ProductDrawer({ product, featuredId, releases, demos, videos, onClose, onChanged, onCreated, flash, onActivateRelease, onToggleDemo, onToggleVideo, onDelete }:{
  product:DrawerProduct | null; featuredId:string;
  releases:DrawerRelease[]; demos:DrawerRelease[]; videos:DrawerVideo[];
  onClose:()=>void; onChanged:()=>Promise<void>; onCreated:(id:string)=>Promise<void>; flash:(text:string)=>void;
  onActivateRelease:(id:string)=>Promise<void>; onToggleDemo:(item:DrawerRelease)=>Promise<void>; onToggleVideo:(item:DrawerVideo)=>Promise<void>;
  onDelete:(kind:"release"|"demo"|"video", id:string, label:string)=>Promise<void>;
}) {
  const creating = !product;
  const [tab,setTab] = useState<Tab>("details");
  useEffect(() => { setTab("details"); }, [product?.id]);
  useEffect(() => {
    const onKey = (event:KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tabs = creating ? TABS.slice(0, 1) : TABS;
  return <aside className="pd-drawer" aria-label={creating ? "New product" : `Edit ${product.name}`}>
    <div className="pd-drawer-head">
      {product?.image ? <img src={product.image} alt=""/> : <span className="pd-drawer-thumb" aria-hidden="true"/>}
      <div><strong>{creating ? "New product" : product.name}{product && product.id === featuredId && <span className="pd-featured-tag"><Star size={12} aria-hidden="true"/> Featured</span>}</strong><small>{creating ? "Fill in the details, then add images and files." : `/plugins/${product.slug || product.id}`}</small></div>
      <button type="button" className="pd-close" aria-label="Close" onClick={onClose}><X size={18} aria-hidden="true"/></button>
    </div>
    <div className="pd-tabs" role="tablist" aria-label="Product sections">
      {tabs.map(item => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>
    <div className="pd-body">
      {tab === "details" && <DetailsTab key={`${product?.id ?? "new"}|${featuredId}`} product={product} isFeatured={!!product && product.id === featuredId} onSaved={async text => { await onChanged(); flash(text); }} onCreated={onCreated}/>}
      {product && tab === "images" && <ImagesTab key={product.id} product={product} onSaved={async text => { await onChanged(); flash(text); }}/>}
      {product && tab === "page" && <PageTab key={product.id} product={product} onSaved={async text => { await onChanged(); flash(text); }}/>}
      {product && tab === "files" && <FilesTab product={product} releases={releases} demos={demos} onUploaded={async text => { await onChanged(); flash(text); }} onActivateRelease={onActivateRelease} onToggleDemo={onToggleDemo} onDelete={onDelete}/>}
      {product && tab === "videos" && <VideosTab product={product} videos={videos} onUploaded={async text => { await onChanged(); flash(text); }} onToggleVideo={onToggleVideo} onDelete={onDelete}/>}
      {product && tab === "translations" && <TranslationsTab key={product.id} product={product} onSaved={async text => { await onChanged(); flash(text); }}/>}
    </div>
    {product && <div className="pd-drawer-foot"><a className="button ghost" href={`/plugins/${encodeURIComponent(product.slug || product.id)}`} target="_blank" rel="noopener"><ExternalLink size={15} aria-hidden="true"/> View page</a></div>}
  </aside>;
}

function DetailsTab({ product, isFeatured, onSaved, onCreated }:{ product:DrawerProduct|null; isFeatured:boolean; onSaved:(text:string)=>Promise<void>; onCreated:(id:string)=>Promise<void> }) {
  const [draft,setDraft] = useState({
    name:product?.name ?? "", slug:product?.slug ?? "", category:product?.category ?? "Instrument",
    price:product ? (product.price_cents / 100).toFixed(2) : "29.00", status:product?.status ?? "draft", description:product?.description ?? "",
    featured:isFeatured, video:product?.video_id ? `https://www.youtube.com/watch?v=${product.video_id}` : "", video_title:product?.video_title ?? "", featured_text:product?.featured_text ?? "",
  });
  const videoPreview = youtubeId(draft.video);
  const [chips,setChips] = useState<string[]>(product ? list(product.features) : []);
  const [chip,setChip] = useState("");
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");

  function addChip() { const value = chip.trim(); if (value && !chips.includes(value) && chips.length < 20) setChips([...chips, value]); setChip(""); }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const price_cents = toCents(draft.price);
    if (!Number.isFinite(price_cents)) { setError("Enter the price in US dollars, for example 29.00"); return; }
    if (draft.status === "published" && price_cents === 0 && !window.confirm("Publish this product as free? Anyone will be able to get it without paying.")) return;
    if (videoPreview === null) { setError("Paste a YouTube video link, for example https://www.youtube.com/watch?v=…"); return; }
    if (draft.featured && draft.status === "draft" && !window.confirm("This product is a Draft, so it is hidden. The homepage will keep showing Voice MIDI in Featured Release until you publish it or set it to Coming soon. Continue?")) return;
    setBusy(true); setError("");
    const featuredData = { featured:draft.featured, video:draft.video, video_title:draft.video_title, featured_text:draft.featured_text };
    try {
      const features = chip.trim() ? [...chips, chip.trim()] : chips;
      if (!product) {
        const result = await send("/api/products", "POST", { name:draft.name, slug:draft.slug, category:draft.category, description:draft.description, status:draft.status, price_cents, image:"", gallery_images:[], features, description_translations:{}, ...featuredData });
        if (result.id) await onCreated(result.id);
        return;
      }
      await send(`/api/products/${encodeURIComponent(product.id)}`, "PUT", { name:draft.name, slug:draft.slug, category:draft.category, description:draft.description, price_cents, status:draft.status, image:product.image, features, checkout_url:product.checkout_url, ...featuredData });
      setChip(""); setChips(features);
      await onSaved(`${draft.name} saved`);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not save"); }
    finally { setBusy(false); }
  }

  return <form className="admin-form pd-form" onSubmit={submit}>
    <label>Name<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} required maxLength={120} disabled={busy}/></label>
    <div className="two">
      <label>Price (USD)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} required disabled={busy}/></label>
      <label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})} disabled={busy}>{STATUS_OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <div className="two">
      <label>Category<input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} maxLength={60} disabled={busy}/></label>
      <label>Web address<input value={draft.slug} onChange={e=>setDraft({...draft,slug:e.target.value})} placeholder="made from the name" disabled={busy}/></label>
    </div>
    <label>Description (English)<textarea lang="en" maxLength={4000} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} disabled={busy}/><small>Other languages are under Translations.</small></label>
    <fieldset className="pd-chips" disabled={busy}>
      <legend>Feature chips</legend>
      <div className="pd-chip-list">
        {chips.map(item => <span className="pd-chip" key={item}>{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => setChips(chips.filter(x => x !== item))}><X size={13} aria-hidden="true"/></button></span>)}
        {!chips.length && <small>No chips yet.</small>}
      </div>
      <div className="pd-inline">
        <label className="sr-only" htmlFor="pd-new-chip">New feature chip</label>
        <input id="pd-new-chip" value={chip} onChange={e=>setChip(e.target.value)} onKeyDown={e=>{ if (e.key === "Enter") { e.preventDefault(); addChip(); } }} placeholder="e.g. Scale-aware notes" maxLength={60}/>
        <button type="button" className="button ghost" onClick={addChip}><Plus size={15} aria-hidden="true"/> Add</button>
      </div>
    </fieldset>
    <fieldset className="pd-featured" disabled={busy}>
      <legend>Featured Release</legend>
      <label className="admin-check pd-featured-check"><input type="checkbox" checked={draft.featured} onChange={e=>setDraft({...draft,featured:e.target.checked})}/> Show this product in Featured Release on the homepage</label>
      <small>Only one product is featured at a time: ticking this one replaces the current one.</small>
      <label>YouTube video<input value={draft.video} onChange={e=>{ setDraft({...draft,video:e.target.value}); setError(""); }} inputMode="url" spellCheck={false} placeholder="https://www.youtube.com/watch?v=…"/>
        {videoPreview === null ? <small className="pd-warn">Not a YouTube link</small> : <small>Shown in Featured Release when this product is featured.</small>}</label>
      {videoPreview && <img className="pd-video-thumb" src={`https://i.ytimg.com/vi/${videoPreview}/hqdefault.jpg`} alt="Video preview"/>}
      <label>Video title<input value={draft.video_title} onChange={e=>setDraft({...draft,video_title:e.target.value})} maxLength={120} placeholder={`How to use ${draft.name || "this plugin"}`}/></label>
      <label>Featured text<textarea value={draft.featured_text} onChange={e=>setDraft({...draft,featured_text:e.target.value})} maxLength={300} placeholder="One or two sentences under the Featured Release heading."/><small>Leave empty to use the description.</small></label>
    </fieldset>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="button primary" disabled={busy}>{busy ? "Saving…" : product ? "Save details" : "Create product"}</button>
  </form>;
}

function ImagesTab({ product, onSaved }:{ product:DrawerProduct; onSaved:(text:string)=>Promise<void> }) {
  const [busy,setBusy] = useState<string|null>(null); const [error,setError] = useState("");
  const extras = list(product.gallery_images).filter(src => src !== product.image);
  const shown = extras.slice(0, EXTRA_PHOTOS);

  async function run(label:string, work:()=>Promise<void>, done:string) {
    setBusy(label); setError("");
    try { await work(); await onSaved(done); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Image could not be saved"); }
    finally { setBusy(null); }
  }
  const saveGallery = (next:string[]) => send(`/api/products/${encodeURIComponent(product.id)}`, "PATCH", { gallery_images:next }).then(() => undefined);
  const saveMain = (image:string) => send(`/api/products/${encodeURIComponent(product.id)}`, "PATCH", { image }).then(() => undefined);

  return <div className="pd-images">
    <section>
      <h3>Main image</h3>
      <div className="pd-main-image">{product.image ? <img src={product.image} alt={`${product.name} main image`}/> : <span>No image yet. The store shows the logo until you add one.</span>}</div>
      <label className="button ghost pd-file-button"><Upload size={15} aria-hidden="true"/> {busy === "main" ? "Uploading…" : product.image ? "Replace main image" : "Upload main image"}
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!!busy} onChange={event=>{ const file = event.target.files?.[0]; event.target.value = ""; if (file) void run("main", async () => saveMain(await uploadProductImage(file)), "Main image updated"); }}/>
      </label>
    </section>
    <section>
      <h3>More photos <small>{shown.length} of {EXTRA_PHOTOS}</small></h3>
      <p className="admin-hint">The product page shows four photos. Empty places show close-ups of the main image.</p>
      <div className="pd-photo-grid">
        {shown.map((src, index) => <figure key={src}>
          <img src={src} alt={`Photo ${index + 2}`}/>
          <figcaption>
            <button type="button" disabled={!!busy} onClick={() => void run(`main-${index}`, async () => { await saveMain(src); await saveGallery([product.image, ...extras.filter(x => x !== src)].filter(Boolean)); }, "Main image changed")}>Use as main</button>
            <button type="button" className="danger" aria-label={`Remove photo ${index + 2}`} disabled={!!busy} onClick={() => void run(`remove-${index}`, () => saveGallery(extras.filter(x => x !== src)), "Photo removed")}><Trash2 size={14} aria-hidden="true"/></button>
          </figcaption>
        </figure>)}
        {shown.length < EXTRA_PHOTOS && <label className="pd-photo-add"><ImagePlus size={20} aria-hidden="true"/>{busy === "add" ? "Uploading…" : "Add photo"}
          <input type="file" accept="image/png,image/jpeg,image/webp" disabled={!!busy} onChange={event=>{ const file = event.target.files?.[0]; event.target.value = ""; if (file) void run("add", async () => saveGallery([...extras, await uploadProductImage(file)]), "Photo added"); }}/>
        </label>}
      </div>
    </section>
    {error && <p className="admin-error" role="alert">{error}</p>}
  </div>;
}

function PageTab({ product, onSaved }:{ product:DrawerProduct; onSaved:(text:string)=>Promise<void> }) {
  const [steps,setSteps] = useState<PageStep[]>(() => readSteps(product.page_steps));
  const [specs,setSpecs] = useState<PageSpec[]>(() => readSpecs(product.page_specs));
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const setStep = (index:number, patch:Partial<PageStep>) => setSteps(steps.map((step,i) => i === index ? { ...step, ...patch } : step));
  const setSpec = (index:number, patch:Partial<PageSpec>) => setSpecs(specs.map((spec,i) => i === index ? { ...spec, ...patch } : spec));

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try { await send(`/api/products/${encodeURIComponent(product.id)}`, "PATCH", { page_steps:steps, page_specs:specs }); await onSaved("Page content saved"); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Could not save"); }
    finally { setBusy(false); }
  }

  return <form className="admin-form pd-form" onSubmit={submit}>
    <fieldset className="pd-rows" disabled={busy}>
      <legend>How it works</legend>
      <p className="admin-hint">Short steps shown on the product page. Leave empty to show the feature chips instead.</p>
      {steps.map((step, index) => <div className="pd-row" key={index}>
        <span className="pd-row-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="pd-row-fields">
          <label>Step {index + 1} title<input value={step.title} maxLength={60} onChange={e=>setStep(index,{ title:e.target.value })} placeholder="Listen"/></label>
          <label>Text<input value={step.text} maxLength={240} onChange={e=>setStep(index,{ text:e.target.value })} placeholder="Capture your voice in real time."/></label>
        </div>
        <button type="button" className="pd-row-remove" aria-label={`Remove step ${index + 1}`} onClick={() => setSteps(steps.filter((_,i) => i !== index))}><Trash2 size={15} aria-hidden="true"/></button>
      </div>)}
      {steps.length < MAX_STEPS && <button type="button" className="button ghost" onClick={() => setSteps([...steps, { title:"", text:"" }])}><Plus size={15} aria-hidden="true"/> Add step</button>}
    </fieldset>
    <fieldset className="pd-rows" disabled={busy}>
      <legend>Specs</legend>
      {!specs.length && <p className="admin-hint">Empty: the page shows the standard plugin specs. <button type="button" className="adm-link" onClick={() => setSpecs(DEFAULT_SPECS.map(spec => ({ ...spec })))}>Start from the standard specs</button></p>}
      {specs.map((spec, index) => <div className="pd-row" key={index}>
        <div className="pd-row-fields two">
          <label>Name<input value={spec.label} maxLength={40} onChange={e=>setSpec(index,{ label:e.target.value })} placeholder="Format"/></label>
          <label>Value<input value={spec.value} maxLength={200} onChange={e=>setSpec(index,{ value:e.target.value })} placeholder="VST3 (64-bit)"/></label>
        </div>
        <button type="button" className="pd-row-remove" aria-label={`Remove spec ${spec.label || index + 1}`} onClick={() => setSpecs(specs.filter((_,i) => i !== index))}><Trash2 size={15} aria-hidden="true"/></button>
      </div>)}
      {specs.length < MAX_SPECS && <button type="button" className="button ghost" onClick={() => setSpecs([...specs, { label:"", value:"" }])}><Plus size={15} aria-hidden="true"/> Add spec</button>}
    </fieldset>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save page content"}</button>
  </form>;
}

function FilesTab({ product, releases, demos, onUploaded, onActivateRelease, onToggleDemo, onDelete }:{
  product:DrawerProduct; releases:DrawerRelease[]; demos:DrawerRelease[]; onUploaded:(text:string)=>Promise<void>;
  onActivateRelease:(id:string)=>Promise<void>; onToggleDemo:(item:DrawerRelease)=>Promise<void>; onDelete:(kind:"release"|"demo"|"video", id:string, label:string)=>Promise<void>;
}) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const mine = releases.filter(item => item.product_id === product.id);
  const myDemos = demos.filter(item => item.product_id === product.id);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const data = new FormData(form);
    const demo = data.get("release_type") === "demo"; data.set("product_id", product.id);
    setBusy(true); setError("");
    try {
      const response = await fetch(demo ? "/api/demos" : "/api/releases", { method:"POST", body:data });
      const result = await response.json().catch(() => ({})) as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed");
      form.reset(); await onUploaded(demo ? "Demo uploaded. Activate it to show Try free demo." : "Full version uploaded. Activate it so customers download it.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  const row = (item:DrawerRelease, kind:"release"|"demo") => <li key={item.id}>
    <span><b>v{item.version}</b><small>{item.file_name} · {mb(item.file_size)}</small></span>
    {item.is_active ? <span className="adm-pill published">Active</span> : <span className="adm-pill draft">{kind === "demo" ? "Off" : "Inactive"}</span>}
    <span className="pd-file-actions">
      {kind === "release" && !item.is_active && <button type="button" onClick={() => void onActivateRelease(item.id)}>Activate</button>}
      {kind === "demo" && <button type="button" onClick={() => void onToggleDemo(item)}>{item.is_active ? "Turn off" : "Activate"}</button>}
      <button type="button" className="danger" aria-label={`Delete v${item.version}`} onClick={() => void onDelete(kind, item.id, `${product.name} v${item.version}`)}><Trash2 size={14} aria-hidden="true"/></button>
    </span>
  </li>;

  return <div className="pd-files">
    <section><h3>Full version <small>needs a licence key</small></h3>{mine.length ? <ul className="pd-file-list">{mine.map(item => row(item, "release"))}</ul> : <p className="admin-hint">No full version yet. Customers can download only after a ZIP is uploaded and active.</p>}</section>
    <section><h3>Demo <small>free Try download</small></h3>{myDemos.length ? <ul className="pd-file-list">{myDemos.map(item => row(item, "demo"))}</ul> : <p className="admin-hint">No demo yet. Upload one to show Try free demo on the page.</p>}</section>
    <form className="admin-form pd-form pd-upload" onSubmit={submit}>
      <h3>Upload a ZIP</h3>
      <fieldset disabled={busy}>
        <div className="two">
          <label>Type<select name="release_type"><option value="licensed">Full version</option><option value="demo">Demo</option></select></label>
          <label>Version<input name="version" placeholder="1.0.0" required maxLength={80}/></label>
        </div>
        <label>Notes<textarea name="notes" placeholder="What changed? What can the demo do?"/></label>
        <label className="dropzone">ZIP file<input name="file" type="file" accept=".zip" required/><span>Demo ZIPs up to 75 MB.</span></label>
        <button className="button primary">{busy ? "Uploading…" : "Upload ZIP"}</button>
      </fieldset>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  </div>;
}

function VideosTab({ product, videos, onUploaded, onToggleVideo, onDelete }:{
  product:DrawerProduct; videos:DrawerVideo[]; onUploaded:(text:string)=>Promise<void>; onToggleVideo:(item:DrawerVideo)=>Promise<void>; onDelete:(kind:"release"|"demo"|"video", id:string, label:string)=>Promise<void>;
}) {
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const mine = videos.filter(item => item.product_id === product.id);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget; const data = new FormData(form); data.set("product_id", product.id);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setError("Choose a video"); return; }
    if (file.size > 50 * 1024 * 1024) { setError("Video must be 50 MB or smaller"); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/tutorials", { method:"POST", body:data });
      const result = await response.json().catch(() => ({})) as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Video could not be uploaded");
      form.reset(); await onUploaded(data.get("published") === "on" ? "Video published in How to use" : "Video saved as hidden");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Video upload failed"); }
    finally { setBusy(false); }
  }

  return <div className="pd-files">
    <section><h3>Video guides <small>{mine.length}</small></h3>
      {mine.length ? <ul className="pd-file-list">{mine.map(item => <li key={item.id}>
        <span><b>{item.title}</b><small>{mb(item.file_size)}</small></span>
        {item.is_published ? <span className="adm-pill published">Published</span> : <span className="adm-pill draft">Hidden</span>}
        <span className="pd-file-actions">
          <button type="button" onClick={() => void onToggleVideo(item)}>{item.is_published ? "Hide" : "Publish"}</button>
          <button type="button" className="danger" aria-label={`Delete ${item.title}`} onClick={() => void onDelete("video", item.id, `Video "${item.title}"`)}><Trash2 size={14} aria-hidden="true"/></button>
        </span>
      </li>)}</ul> : <p className="admin-hint">No videos for this product yet. They appear in How to use and on the product page.</p>}
    </section>
    <form className="admin-form pd-form pd-upload" onSubmit={submit}>
      <h3>Upload a video</h3>
      <fieldset disabled={busy}>
        <label>Title<input name="title" required maxLength={160} placeholder={`How to use ${product.name}`}/></label>
        <label>Description<textarea name="description" maxLength={2000} placeholder="What will the viewer learn?"/></label>
        <label className="dropzone">Video file<input name="file" type="file" accept="video/mp4,video/webm,.mp4,.webm" required/><span>MP4 or WEBM, up to 50 MB.</span></label>
        <label className="admin-check"><input type="checkbox" name="published" defaultChecked/> Publish in How to use now</label>
        <button className="button primary">{busy ? "Uploading…" : "Upload video"}</button>
      </fieldset>
      {error && <p className="admin-error" role="alert">{error}</p>}
    </form>
  </div>;
}

function TranslationsTab({ product, onSaved }:{ product:DrawerProduct; onSaved:(text:string)=>Promise<void> }) {
  const [value,setValue] = useState<DescriptionTranslations>(() => ({ en:product.description, ...builtInTranslations(product), ...readDescriptionTranslations(product.description_translations) }));
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try { await send(`/api/products/${encodeURIComponent(product.id)}`, "PATCH", { description_translations:value }); await onSaved("Translations saved"); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Could not save"); }
    finally { setBusy(false); }
  }
  return <form className="admin-form pd-form" onSubmit={submit}>
    <DescriptionFields includeEnglish={false} value={value} onChange={setValue} disabled={busy}/>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save translations"}</button>
  </form>;
}
