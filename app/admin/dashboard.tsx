"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, FileArchive, KeyRound, LayoutDashboard, LogOut, Mail, Package, PlayCircle, Receipt, Send, Trash2, X } from "lucide-react";
import DescriptionEditor,{DescriptionFields} from './description-editor';
import type { DescriptionTranslations } from '@/lib/product-descriptions';
import type { AdminSection } from '@/lib/admin-navigation';
import { licenseEmail } from '@/lib/email';
import { PAYMENT_METHODS } from '@/lib/manual-order';

type Product = { id:string; slug:string; name:string; category:string; description:string; price_cents:number; status:string; image:string; features:string; checkout_url:string; gallery_images:string;description_translations?:string };
type Release = { id:string; product_id:string; product_name:string; version:string; file_name:string; file_size:number; is_active:number };
type License = { id:string; product_name:string; customer_email:string; license_key:string; status:string; download_count:number; max_downloads:number };
type Order = { id:string; product_id:string; product_name:string; customer_email:string; customer_phone?:string; amount_cents:number; currency?:string; payment_method?:string; provider_ref?:string; status:string; created_at:string; license_id?:string|null; license_key?:string|null };
type NotifyRequest = { id:string; product_id:string; product_name:string | null; email:string; created_at:string };
type IssuedLicense = { id:string; key:string; email:string; productName:string; maxDownloads:number };
type Tutorial = { id:string; product_name:string | null; title:string; description:string; file_name:string; file_size:number; is_published:number };

const empty = { name:"", slug:"", category:"Instrument", description:"", price:"29.00", status:"draft", image:"", features:"", gallery_images:"",description_translations:{} as DescriptionTranslations };
const STATUS_LABELS: Record<string,string> = { draft:"Draft (hidden)", published:"Published (on sale)", "coming-soon":"Coming soon" };
const PAID_STATUSES = new Set(["paid","completed"]);

const NAV: { id:AdminSection; label:string; Icon:typeof Package }[] = [
  { id:"overview", label:"Overview", Icon:LayoutDashboard },
  { id:"products", label:"Products", Icon:Package },
  { id:"videos", label:"Videos", Icon:PlayCircle },
  { id:"releases", label:"Releases", Icon:FileArchive },
  { id:"licenses", label:"Licenses", Icon:KeyRound },
  { id:"orders", label:"Orders", Icon:Receipt },
  { id:"notify", label:"Notify list", Icon:Mail },
];

function galleryText(value:string) { try { const parsed=JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item):item is string=>typeof item==='string').join("\n") : ""; } catch { return ""; } }
function featureText(value:string) { try { const parsed=JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item):item is string=>typeof item==='string').join(", ") : ""; } catch { return ""; } }
function splitFeatures(value:string) { return value.split(",").map(x=>x.trim()).filter(Boolean); }
// The owner types dollars; the API stores whole cents.
function toCents(value:string) { const amount=Number(value); return Number.isFinite(amount) && amount >= 0 ? Math.round(amount*100) : NaN; }
function money(cents:number, currency="USD") {
  if (currency === "TZS") return `TSh ${Math.round(cents/100).toLocaleString("en-US")}`;
  return `$${(cents/100).toFixed(2)}`;
}
function totalsByCurrency(orders:Order[]) {
  const totals = new Map<string,number>();
  for (const order of orders) totals.set(order.currency || "USD", (totals.get(order.currency || "USD") ?? 0) + order.amount_cents);
  return [...totals].map(([currency,cents]) => money(cents,currency)).join(" + ") || money(0);
}
// Opens the owner's own email app with the message filled in; used when Resend is not set up.
function mailto(to:string, subject:string, body:string, bcc?:string) {
  const params = new URLSearchParams({ subject, body, ...(bcc ? { bcc } : {}) });
  return `mailto:${encodeURIComponent(to)}?${params.toString().replace(/\+/g,"%20")}`;
}

export default function AdminDashboard({ user, signOut,initialSection='overview' }:{ user:string; signOut:string;initialSection?:AdminSection }) {
  const [tab,setTab] = useState<AdminSection>(initialSection);
  const [products,setProducts] = useState<Product[]>([]);
  const [releases,setReleases] = useState<Release[]>([]);
  const [demos,setDemos] = useState<Release[]>([]);
  const [uploadingRelease,setUploadingRelease] = useState(false);
  const [licenses,setLicenses] = useState<License[]>([]);
  const [orders,setOrders] = useState<Order[]>([]);
  const [tutorials,setTutorials] = useState<Tutorial[]>([]);
  const [notifyRequests,setNotifyRequests] = useState<NotifyRequest[]>([]);
  const [uploadingVideo,setUploadingVideo] = useState(false);
  const [videoMessage,setVideoMessage] = useState("");
  const [form,setForm] = useState(empty);
  const [message,setMessage] = useState("");
  const [imageFile,setImageFile] = useState<File | null>(null);
  const [imagePreview,setImagePreview] = useState("");
  const [savingProduct,setSavingProduct] = useState(false);
  const [updatingImage,setUpdatingImage] = useState<string | null>(null);
  const [editingDescriptions,setEditingDescriptions]=useState<Product|null>(null);
  const [editingProduct,setEditingProduct]=useState<Product|null>(null);
  const [galleryDrafts,setGalleryDrafts]=useState<Record<string,string>>({});
  const [savingGallery,setSavingGallery]=useState<string|null>(null);
  const [issuingLicense,setIssuingLicense]=useState(false);
  const [newLicense,setNewLicense]=useState<IssuedLicense | null>(null);
  const [licenseQuery,setLicenseQuery]=useState("");
  const [emailReady,setEmailReady]=useState(false);
  const [sendingEmail,setSendingEmail]=useState<string|null>(null);
  const [recordingPayment,setRecordingPayment]=useState(false);
  const [paymentMethod,setPaymentMethod]=useState("mpesa");
  const [orderLicense,setOrderLicense]=useState<IssuedLicense | null>(null);
  const [announcement,setAnnouncement]=useState({ productId:"", subject:"", message:"" });

  useEffect(() => {
    if (!imageFile) { setImagePreview(""); return; }
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  const load = useCallback(async () => {
    const read = async <T,>(url:string) => { const response = await fetch(url); if (!response.ok) throw new Error(response.status === 401 ? "Session expired. Sign in again at /admin." : "Unable to load administration data"); return await response.json() as T; };
    const [p,r,l,o,v,d,n] = await Promise.all([
      read<{ products?: Product[] }>("/api/products"), read<{ releases?: Release[] }>("/api/releases"),
      read<{ licenses?: License[] }>("/api/licenses"), read<{ orders?: Order[] }>("/api/orders"),
      read<{ tutorials?: Tutorial[] }>("/api/tutorials"),
      read<{ demos?: Release[] }>("/api/demos"),
      read<{ requests?: NotifyRequest[] }>("/api/notify"),
    ]);
    setProducts(p.products ?? []); setGalleryDrafts(Object.fromEntries((p.products ?? []).map(product=>[product.id,galleryText(product.gallery_images ?? "[]")]))); setReleases(r.releases ?? []); setLicenses(l.licenses ?? []); setOrders(o.orders ?? []);
    setTutorials(v.tutorials ?? []);
    setDemos(d.demos ?? []); setNotifyRequests(n.requests ?? []);
  }, []);
  useEffect(() => { load().catch(error=>setMessage(error instanceof Error ? error.message : "Unable to load store data")); }, [load]);
  useEffect(() => {
    fetch("/api/admin/email").then(response => response.ok ? response.json() : null).then((data:{configured?:boolean}|null) => setEmailReady(!!data?.configured)).catch(() => setEmailReady(false));
  }, []);
  const flash = (text:string) => { setMessage(text); setTimeout(()=>setMessage(""),3500); };

  const filteredLicenses = useMemo(() => {
    const query = licenseQuery.trim().toLowerCase();
    if (!query) return licenses;
    return licenses.filter(item => [item.customer_email,item.license_key,item.product_name].some(value => value?.toLowerCase().includes(query)));
  }, [licenses,licenseQuery]);
  const paidOrders = orders.filter(order => PAID_STATUSES.has(order.status));

  async function uploadProductImage(file:File) {
    if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller");
    const data = new FormData(); data.set("file", file);
    const response = await fetch("/api/product-images", { method:"POST", body:data });
    const result = await response.json() as { image?:string; error?:string };
    if (!response.ok || !result.image) throw new Error(result.error ?? "Image could not be uploaded");
    return result.image;
  }

  async function replaceImage(product:Product, file:File) {
    setUpdatingImage(product.id);
    try {
      const image = await uploadProductImage(file);
      const response = await fetch(`/api/products/${product.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({image}) });
      if (!response.ok) throw new Error("Product image could not be saved");
      await load(); flash("Product image updated");
    } catch (error) { flash(error instanceof Error ? error.message : "Image update failed"); }
    finally { setUpdatingImage(null); }
  }

  async function saveGalleryImages(product:Product) {
    setSavingGallery(product.id);
    try {
      const gallery_images=(galleryDrafts[product.id] ?? "").split(/\r?\n/).map(item=>item.trim()).filter(Boolean);
      const response=await fetch(`/api/products/${encodeURIComponent(product.id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({gallery_images})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error ?? "Product gallery could not be saved");
      await load(); flash("Product gallery saved");
    } catch(error) { flash(error instanceof Error ? error.message : "Product gallery could not be saved"); }
    finally { setSavingGallery(null); }
  }

  async function addProduct(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const price_cents = toCents(form.price);
    if (!Number.isFinite(price_cents)) { flash("Enter the price in US dollars, for example 29.00"); return; }
    setSavingProduct(true);
    try {
      const image = imageFile ? await uploadProductImage(imageFile) : form.image;
      if (imageFile) { setForm(previous => ({...previous,image})); setImageFile(null); }
      const payload = { name:form.name, slug:form.slug, category:form.category, description:form.description, description_translations:form.description_translations, status:form.status, price_cents, image, gallery_images:form.gallery_images.split(/\r?\n/).map(x=>x.trim()).filter(Boolean), features:splitFeatures(form.features) };
      const response = await fetch("/api/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const result = await response.json() as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Product could not be created");
      setForm(empty); setImageFile(null); element.reset(); await load(); flash("Product created");
    } catch (error) { flash(error instanceof Error ? error.message : "Product could not be created"); }
    finally { setSavingProduct(false); }
  }

  async function uploadRelease(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const demo = formData.get("release_type") === "demo";
    setUploadingRelease(true);
    try {
      const response = await fetch(demo ? "/api/demos" : "/api/releases", { method:"POST", body:formData });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      formElement.reset(); await load(); flash(demo ? "Demo ZIP uploaded. Activate it to enable Try." : "Licensed ZIP uploaded. Activate it to make it the download customers get.");
    } catch (error) { flash(error instanceof Error ? error.message : "Upload failed"); }
    finally { setUploadingRelease(false); }
  }

  async function uploadVideo(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const data = new FormData(element);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setVideoMessage("Choose a video"); return; }
    if (file.size > 50 * 1024 * 1024) { setVideoMessage("Video must be 50 MB or smaller"); return; }
    setUploadingVideo(true); setVideoMessage("Uploading video. Keep this page open…");
    try {
      const response = await fetch("/api/tutorials", { method:"POST", body:data });
      const result = await response.json() as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Video could not be uploaded");
      element.reset(); await load();
      setVideoMessage(data.get("published") === "on" ? "Video published. Customers can watch it in How to use." : "Video saved as a draft. Publish it when ready.");
    } catch (error) { setVideoMessage(error instanceof Error ? error.message : "Video upload failed"); }
    finally { setUploadingVideo(false); }
  }

  async function publishVideo(item:Tutorial) {
    try {
      const response = await fetch(`/api/tutorials/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({published:!item.is_published}) });
      if (!response.ok) throw new Error("Video status could not be changed");
      await load(); flash(item.is_published ? "Video hidden from customers" : "Video published");
    } catch (error) { flash(error instanceof Error ? error.message : "Unable to update video"); }
  }

  async function addLicense(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (issuingLicense) return;
    const formElement = event.currentTarget; const data = Object.fromEntries(new FormData(formElement));
    setIssuingLicense(true);
    try {
      const response = await fetch("/api/licenses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
      const result = await response.json() as { license_key?: string; error?: string };
      if (!response.ok || !result.license_key) throw new Error(result.error ?? "License could not be created");
      // Keep the key on screen until the owner dismisses it; it is what the customer needs.
      const product = products.find(item => item.id === data.product_id);
      setNewLicense({ id:(result as {id?:string}).id ?? "", key:result.license_key, email:String(data.customer_email ?? ""), productName:product?.name ?? "MLAM plugin", maxDownloads:Number(data.max_downloads || 5) });
      formElement.reset(); await load();
    } catch (error) { flash(error instanceof Error ? error.message : "License could not be created"); }
    finally { setIssuingLicense(false); }
  }

  async function copy(text:string, done:string) {
    try { await navigator.clipboard.writeText(text); flash(done); }
    catch { flash("Copy failed. Select the text and copy it manually."); }
  }

  async function activate(id:string) {
    const response = await fetch(`/api/releases/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active:true}) });
    flash(response.ok ? "Release activated. Licensed customers now download this version." : "Release could not be activated");
    if (response.ok) await load();
  }
  async function activateDemo(item:Release) {
    const response = await fetch(`/api/demos/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active:!item.is_active}) });
    flash(response.ok ? (item.is_active ? "Demo deactivated" : "Demo activated. Try is enabled for published products") : "Demo could not be updated");
    if (response.ok) await load();
  }
  async function toggleLicense(item:License) {
    const revoking = item.status === "active";
    if (revoking && !window.confirm(`Revoke the license for ${item.customer_email}? They will no longer be able to download ${item.product_name}.`)) return;
    const response = await fetch(`/api/licenses/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:revoking ? "revoked" : "active"}) });
    flash(response.ok ? (revoking ? "License revoked" : "License restored") : "License could not be updated");
    if (response.ok) await load();
  }
  async function recordPayment(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recordingPayment) return;
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement));
    const issue = data.issue_license === "on";
    setRecordingPayment(true);
    try {
      const response = await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...data, issue_license:issue }) });
      const result = await response.json() as { error?:string; license_id?:string|null; license_key?:string|null; product_name?:string };
      if (!response.ok) throw new Error(result.error ?? "Payment could not be recorded");
      if (result.license_id && result.license_key) setOrderLicense({ id:result.license_id, key:result.license_key, email:String(data.customer_email ?? "").trim().toLowerCase(), productName:result.product_name ?? "MLAM plugin", maxDownloads:Number(data.max_downloads || 5) });
      formElement.reset(); setPaymentMethod("mpesa"); await load();
      flash(issue ? "Payment recorded and license issued" : "Payment recorded");
    } catch (error) { flash(error instanceof Error ? error.message : "Payment could not be recorded"); }
    finally { setRecordingPayment(false); }
  }

  async function issueOrderLicense(order:Order) {
    const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/license`, { method:"POST", headers:{"Content-Type":"application/json"}, body:"{}" });
    const result = await response.json() as { error?:string; license_id?:string; license_key?:string; product_name?:string };
    if (!response.ok || !result.license_id || !result.license_key) { flash(result.error ?? "License could not be issued"); return; }
    setOrderLicense({ id:result.license_id, key:result.license_key, email:order.customer_email, productName:result.product_name ?? order.product_name ?? "MLAM plugin", maxDownloads:5 });
    await load(); flash("License issued for this order");
  }

  // Sends through the server when email is set up; otherwise opens the owner's email app.
  async function emailLicense(license:IssuedLicense) {
    if (!emailReady) {
      const message = licenseEmail({ productName:license.productName, licenseKey:license.key, maxDownloads:license.maxDownloads, origin:window.location.origin });
      window.location.href = mailto(license.email, message.subject, message.text);
      return;
    }
    setSendingEmail(license.id);
    try {
      const response = await fetch("/api/admin/email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ kind:"license", license_id:license.id }) });
      const result = await response.json() as { error?:string };
      flash(response.ok ? `License key emailed to ${license.email}` : result.error ?? "Email could not be sent");
    } catch { flash("Email could not be sent"); }
    finally { setSendingEmail(null); }
  }

  async function sendAnnouncement(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipients = notifyRequests.filter(item => item.product_id === announcement.productId).map(item => item.email);
    if (!recipients.length) { flash("Nobody is on the launch list for this product"); return; }
    if (!emailReady) {
      window.location.href = mailto("", announcement.subject, announcement.message, recipients.join(","));
      return;
    }
    if (!window.confirm(`Send this announcement to ${recipients.length} ${recipients.length === 1 ? "person" : "people"}?`)) return;
    setSendingEmail("announcement");
    try {
      const response = await fetch("/api/admin/email", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ kind:"announcement", product_id:announcement.productId, subject:announcement.subject, message:announcement.message }) });
      const result = await response.json() as { error?:string; sent?:number; failed?:string[] };
      if (!response.ok && !result.sent) throw new Error(result.error ?? "Announcement could not be sent");
      flash(result.failed?.length ? `Sent to ${result.sent}; failed for ${result.failed.length}` : `Announcement sent to ${result.sent} ${result.sent === 1 ? "person" : "people"}`);
    } catch (error) { flash(error instanceof Error ? error.message : "Announcement could not be sent"); }
    finally { setSendingEmail(null); }
  }

  function startAnnouncement(productId:string) {
    const product = products.find(item => item.id === productId);
    const name = product?.name ?? "Our new plugin";
    const link = product ? `${window.location.origin}/plugins/${encodeURIComponent(product.slug || product.id)}` : window.location.origin;
    setAnnouncement({ productId, subject:`${name} is out now`, message:`Hi,\n\nYou asked us to tell you when ${name} launches. It is available now:\n${link}\n\n— MLAM Studio Pro` });
  }

  async function deleteFile(kind:"release"|"demo"|"video", id:string, label:string) {
    const warning = kind === "release" ? `Delete ${label}? Customers with a license cannot download it if it is the active version.` : `Delete ${label}? This cannot be undone.`;
    if (!window.confirm(warning)) return;
    const url = kind === "release" ? `/api/releases/${id}` : kind === "demo" ? `/api/demos/${id}` : `/api/tutorials/${id}`;
    const response = await fetch(url, { method:"DELETE" });
    flash(response.ok ? `${label} deleted` : `${label} could not be deleted`);
    if (response.ok) await load();
  }

  async function removeNotify(item:NotifyRequest) {
    if (!window.confirm(`Remove ${item.email} from the launch list?`)) return;
    const response = await fetch(`/api/notify/${item.id}`,{method:"DELETE"});
    flash(response.ok ? "Removed from the launch list" : "Could not remove this sign-up");
    if (response.ok) await load();
  }

  const metric = (title:string, value:string|number, detail:string, section:AdminSection) => <button type="button" key={title} className="metric-card" onClick={()=>setTab(section)}><span>{title}</span><strong>{value}</strong><small>{detail}</small></button>;
  const current = NAV.find(item => item.id === tab) ?? NAV[0];
  const issuedPanel = (license:IssuedLicense, dismiss:()=>void) => <div className="new-license" role="status">
    <div><span>New license for {license.email}</span><code>{license.key}</code></div>
    <div className="new-license-actions">
      <button type="button" className="button primary" onClick={()=>void copy(license.key,"License key copied")}><Copy size={15} aria-hidden="true"/> Copy key</button>
      <button type="button" className="button ghost" disabled={sendingEmail === license.id} onClick={()=>void emailLicense(license)}><Send size={15} aria-hidden="true"/> {emailReady ? (sendingEmail === license.id ? "Sending…" : "Email key") : "Open in email app"}</button>
      <button type="button" className="button ghost" aria-label="Dismiss new license" onClick={dismiss}><X size={15} aria-hidden="true"/></button>
    </div>
    <p className="admin-hint">{emailReady ? "Email the key to the customer, or copy it." : "Email sending is not set up, so Email opens your own email app with the key and download steps filled in."}</p>
  </div>;

  return <main className="admin-shell" dir="ltr">
    <aside className="admin-nav" aria-label="Administration sections">
      <a className="brand" href="/"><img src="/mlam-mark-3d-green.png" alt=""/><span><b>MLAM</b> STUDIO PRO<small>ADMINISTRATION</small></span></a>
      <div className="admin-user"><i>{user.slice(0,1).toUpperCase()}</i><span><b>{user}</b><small>Website owner</small></span></div>
      {NAV.map(({id,label,Icon})=><button key={id} type="button" aria-label={label} aria-current={tab===id ? "page" : undefined} title={label} className={tab===id?"active":""} onClick={()=>setTab(id)}><span aria-hidden="true"><Icon size={18} strokeWidth={2}/></span><span className="admin-nav-label">{label}</span></button>)}
      <a className="signout" href={signOut}><LogOut size={16} aria-hidden="true"/> Sign out</a>
    </aside>

    <section className="admin-main">
      <header><h1>{current.label}</h1><a className="button ghost" href="/" target="_blank" rel="noopener">View website <ExternalLink size={14} aria-hidden="true"/></a></header>
      {message&&<div className="toast" role="status">{message}</div>}

      {tab === "overview" && <>
        <div className="metric-grid">
          {metric("Products",products.length,`${products.filter(x=>x.status==="published").length} on sale · ${products.filter(x=>x.status==="coming-soon").length} coming soon`,"products")}
          {metric("Full plugin ZIPs",releases.filter(x=>x.is_active).length,`${releases.length} uploaded`,"releases")}
          {metric("Demo ZIPs",demos.filter(x=>x.is_active).length,`${demos.length} uploaded`,"releases")}
          {metric("Tutorial videos",tutorials.filter(x=>x.is_published).length,`${tutorials.length} uploaded`,"videos")}
          {metric("Licenses",licenses.filter(x=>x.status==="active").length,`${licenses.length} issued`,"licenses")}
          {metric("Paid orders",paidOrders.length,`${totalsByCurrency(paidOrders)} received`,"orders")}
          {metric("Launch list",notifyRequests.length,"people waiting for a release","notify")}
        </div>
        <div className="admin-card"><h2>Store workflow</h2><ol className="pipeline">
          <li><strong>Create the product</strong><span>Name, price in dollars, image and description.</span><button type="button" className="button ghost" onClick={()=>setTab('products')}>Products</button></li>
          <li><strong>Upload the ZIP</strong><span>Full version for buyers, optional demo for Try.</span><button type="button" className="button ghost" onClick={()=>setTab('releases')}>Releases</button></li>
          <li><strong>Publish it</strong><span>Set the status to Published so it goes on sale.</span><button type="button" className="button ghost" onClick={()=>setTab('products')}>Edit status</button></li>
          <li><strong>Issue the license</strong><span>The customer downloads with their key.</span><button type="button" className="button ghost" onClick={()=>setTab('licenses')}>Licenses</button></li>
        </ol></div>
      </>}

      {tab === "products" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={addProduct}>
          <h2>Add plugin</h2>
          <label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required maxLength={120}/></label>
          <div className="two"><label>Slug (web address)<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="made from the name"/></label><label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label></div>
          <label>English description (default)<textarea lang="en" dir="ltr" maxLength={4000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
          <DescriptionFields includeEnglish={false} value={form.description_translations} onChange={description_translations=>setForm({...form,description_translations})} disabled={savingProduct}/>
          <fieldset className="product-image-editor" disabled={savingProduct}><legend>Product image</legend>{(imagePreview || form.image) ? <img className="product-image-preview" src={imagePreview || form.image} alt="Product image preview"/> : <p className="admin-hint">No image yet. The store shows the MLAM logo until you add one.</p>}<label>Choose image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>setImageFile(event.target.files?.[0] ?? null)}/><small>PNG, JPG or WEBP · up to 10 MB. Uploads when you create the product.</small></label><label>Or image URL<input value={form.image} onChange={event=>{setForm({...form,image:event.target.value});setImageFile(null);}} placeholder="/plugins/image.png or https://…"/></label></fieldset>
          <label>Additional gallery image URLs<textarea value={form.gallery_images} onChange={event=>setForm({...form,gallery_images:event.target.value})} placeholder={'/plugins/image-2.png\nhttps://example.com/image-3.webp'} /><small>One image per line. Use a local path or an HTTPS image URL, up to 12 images.</small></label>
          <div className="two"><label>Price (USD)<input type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/><small>Example: 29.00 for $29. Use 0 for free.</small></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{Object.entries(STATUS_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
          <label>Features (comma separated)<input value={form.features} onChange={e=>setForm({...form,features:e.target.value})} placeholder="Voice to MIDI, Scale-aware notes, VST3 for Windows"/></label>
          <button className="button primary" disabled={savingProduct}>{savingProduct ? "Saving product…" : "Create product"}</button>
        </form>
        <div className="admin-card"><h2>Catalog</h2>
          {!products.length ? <div className="empty-state"><b>No products yet</b><span>Create your first plugin with the form.</span></div> :
          <div className="admin-list">{products.map(product=><div key={product.id}>
            <img src={product.image||"/mlam-mark-3d-green-512.png"} alt=""/>
            <span><b>{product.name}</b><small>{product.category} · {product.price_cents > 0 ? money(product.price_cents) : "Free"}</small></span>
            <em className={product.status}>{STATUS_LABELS[product.status] ?? product.status}</em>
            <button type="button" onClick={()=>setEditingProduct(product)}>Edit product</button>
            <button type="button" onClick={()=>setEditingDescriptions(product)}>Translations</button>
            <label className="change-image-control">{updatingImage===product.id ? "Uploading…" : "Change image"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={updatingImage !== null} aria-label={`Change image for ${product.name}`} onChange={event=>{const file=event.target.files?.[0];if(file)void replaceImage(product,file);event.target.value="";}}/></label>
          </div>)}</div>}
          <div className="product-gallery-editor"><h3>Product image galleries</h3><p>Add one image path or HTTPS image URL per line. The main image stays first; these appear as selectable thumbnails.</p>{products.map(product=><div className="product-gallery-row" key={product.id}><label>{product.name}<textarea value={galleryDrafts[product.id] ?? ""} onChange={event=>setGalleryDrafts(previous=>({...previous,[product.id]:event.target.value}))} placeholder="/plugins/product-detail.webp" /></label><button className="button ghost" type="button" disabled={savingGallery===product.id} onClick={()=>void saveGalleryImages(product)}>{savingGallery===product.id ? "Saving…" : "Save gallery"}</button></div>)}</div>
        </div>
      </div>}

      {tab === "releases" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={uploadRelease}><h2>Upload plugin ZIP</h2><label>Version type<select name="release_type" disabled={uploadingRelease}><option value="licensed">Full version (requires license)</option><option value="demo">Demo (free Try download)</option></select></label><label>Product<select name="product_id" required disabled={uploadingRelease}><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Version<input name="version" placeholder="1.0.0" required disabled={uploadingRelease}/></label><label>Release notes / demo limits<textarea name="notes" placeholder="What changed? What can the demo do?" disabled={uploadingRelease}/></label><label className="dropzone">ZIP file<input name="file" type="file" accept=".zip" required disabled={uploadingRelease}/><span>Choose the correct build. Demo ZIPs: up to 75 MB.</span></label><button className="button primary" disabled={uploadingRelease}>{uploadingRelease ? "Uploading ZIP…" : "Upload release"}</button></form>
        <div className="admin-card"><h2>Full version releases</h2>{!releases.length ? <div className="empty-state"><b>No full versions yet</b><span>Customers with a license can only download once a ZIP is uploaded and active.</span></div> : <div className="admin-list">{releases.map(release=><div key={release.id}><i className="file-icon">ZIP</i><span><b>{release.product_name} v{release.version}</b><small>{release.file_name} · {(release.file_size/1048576).toFixed(1)} MB</small></span>{release.is_active?<em className="published">Active</em>:<button type="button" onClick={()=>void activate(release.id)}>Activate</button>}<button type="button" className="danger" aria-label={`Delete ${release.product_name} v${release.version}`} onClick={()=>void deleteFile("release",release.id,`${release.product_name} v${release.version}`)}><Trash2 size={15} aria-hidden="true"/></button></div>)}</div>}
          <h2 className="demo-history-heading">Demo releases</h2>{!demos.length ? <div className="empty-state"><b>No demos yet</b><span>Upload a demo ZIP to show Try free demo on the product page.</span></div> : <div className="admin-list">{demos.map(demo=><div key={demo.id}><i className="file-icon">DEMO</i><span><b>{demo.product_name} v{demo.version}</b><small>{demo.file_name} · {(demo.file_size/1048576).toFixed(1)} MB</small></span><em className={demo.is_active ? "published" : ""}>{demo.is_active ? "Active" : "Draft"}</em><button type="button" onClick={()=>void activateDemo(demo)}>{demo.is_active ? "Deactivate" : "Activate demo"}</button><button type="button" className="danger" aria-label={`Delete demo ${demo.product_name} v${demo.version}`} onClick={()=>void deleteFile("demo",demo.id,`Demo ${demo.product_name} v${demo.version}`)}><Trash2 size={15} aria-hidden="true"/></button></div>)}</div>}</div>
      </div>}

      {tab === "licenses" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={addLicense}><h2>Issue license</h2><label>Product<select name="product_id" required disabled={issuingLicense}><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Customer email<input name="customer_email" type="email" required disabled={issuingLicense}/></label><label>Download limit<input name="max_downloads" type="number" defaultValue="5" min="1" disabled={issuingLicense}/></label><button className="button primary" disabled={issuingLicense}>{issuingLicense ? "Generating…" : "Generate license"}</button>
          {newLicense && issuedPanel(newLicense, ()=>setNewLicense(null))}
        </form>
        <div className="admin-card"><div className="admin-card-head"><h2>Customer licenses</h2><input className="admin-search" type="search" value={licenseQuery} onChange={e=>setLicenseQuery(e.target.value)} placeholder="Search email, key or product" aria-label="Search licenses"/></div>
          {!licenses.length ? <div className="empty-state"><b>No licenses yet</b><span>Issue a license with the form after a customer pays.</span></div> : !filteredLicenses.length ? <div className="empty-state"><b>No matches</b><span>Nothing matches “{licenseQuery}”.</span></div> :
          <div className="license-table">{filteredLicenses.map(license=><div key={license.id}><span><b>{license.customer_email}</b><code>{license.license_key}</code><small>{license.product_name} · {license.download_count}/{license.max_downloads} downloads</small></span><em className={license.status === "active" ? "published" : "revoked"}>{license.status === "active" ? "Active" : "Revoked"}</em><button type="button" className="button ghost" aria-label={`Copy license key for ${license.customer_email}`} onClick={()=>void copy(license.license_key,"License key copied")}><Copy size={15} aria-hidden="true"/></button>{license.status === "active" && <button type="button" className="button ghost" aria-label={`Email license key to ${license.customer_email}`} title={emailReady ? "Email key" : "Open in your email app"} disabled={sendingEmail === license.id} onClick={()=>void emailLicense({ id:license.id, key:license.license_key, email:license.customer_email, productName:license.product_name, maxDownloads:license.max_downloads })}><Send size={15} aria-hidden="true"/></button>}<button type="button" className={license.status === "active" ? "danger" : ""} onClick={()=>void toggleLicense(license)}>{license.status === "active" ? "Revoke" : "Restore"}</button></div>)}</div>}
        </div>
      </div>}

      {tab === "videos" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={uploadVideo}><h2>Upload How to use video</h2><fieldset className="video-upload-fields" disabled={uploadingVideo}><label>Product<select name="product_id"><option value="">General MLAM guide</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Video title<input name="title" required maxLength={160} placeholder="How to use MLAM Imager"/></label><label>Description<textarea name="description" maxLength={2000} placeholder="What will the viewer learn?"/></label><label className="dropzone">Video file<input name="file" type="file" accept="video/mp4,video/webm,.mp4,.webm" required/><span>MP4 or WEBM · up to 50 MB</span></label><label className="publish-video-option"><input type="checkbox" name="published" defaultChecked/>Publish in How to use immediately</label><button className="button primary">{uploadingVideo ? "Uploading video…" : "Upload video"}</button></fieldset>{videoMessage && <p className="video-upload-message" role="status">{videoMessage}</p>}</form>
        <div className="admin-card"><div className="admin-card-head"><h2>Video library</h2><a className="details" href="/tutorials" target="_blank" rel="noopener">View How to use <ExternalLink size={13} aria-hidden="true"/></a></div>{!tutorials.length ? <div className="empty-state"><b>No videos uploaded yet</b><span>Until you upload one, How to use shows Coming soon guides.</span></div> : <div className="admin-video-list">{tutorials.map(item=><article key={item.id}><video controls playsInline preload="none" aria-label={item.title} src={`/api/tutorials/${item.id}/video`}/><h3>{item.title}</h3><p>{item.product_name ?? "General MLAM guide"} · {(item.file_size/1048576).toFixed(1)} MB</p><span>{item.is_published ? "Published" : "Draft / hidden"}</span><div className="admin-video-actions"><button type="button" className="button ghost" onClick={()=>void publishVideo(item)}>{item.is_published ? "Hide video" : "Publish video"}</button><button type="button" className="button ghost danger" onClick={()=>void deleteFile("video",item.id,`Video "${item.title}"`)}><Trash2 size={15} aria-hidden="true"/> Delete</button></div></article>)}</div>}</div>
      </div>}

      {tab === "notify" && !!notifyRequests.length && <form className="admin-card admin-form announcement-form" onSubmit={sendAnnouncement}>
        <h2>Launch announcement</h2>
        <label>Product<select required value={announcement.productId} onChange={e=>startAnnouncement(e.target.value)}><option value="">Select product</option>{[...new Set(notifyRequests.map(item=>item.product_id))].map(id=>{ const count=notifyRequests.filter(item=>item.product_id===id).length; return <option key={id} value={id}>{notifyRequests.find(item=>item.product_id===id)?.product_name ?? id} ({count} waiting)</option>; })}</select></label>
        <label>Subject<input required maxLength={150} value={announcement.subject} onChange={e=>setAnnouncement({...announcement,subject:e.target.value})}/></label>
        <label>Message<textarea required maxLength={5000} rows={6} value={announcement.message} onChange={e=>setAnnouncement({...announcement,message:e.target.value})}/></label>
        <p className="admin-hint">{emailReady ? "Each person gets their own email, so nobody sees the other addresses." : "Email sending is not set up, so this opens your email app with everyone in BCC. Add RESEND_API_KEY to send from here."}</p>
        <div className="admin-form-actions"><button className="button primary" disabled={!announcement.productId || sendingEmail === "announcement"}><Send size={15} aria-hidden="true"/> {sendingEmail === "announcement" ? "Sending…" : emailReady ? `Send to ${notifyRequests.filter(item=>item.product_id===announcement.productId).length || ""} people` : "Open in email app"}</button></div>
      </form>}
      {tab === "notify" && <div className="admin-card"><div className="admin-card-head"><h2>Launch notifications</h2>{!!notifyRequests.length && <button type="button" className="button ghost" onClick={()=>void copy(notifyRequests.map(item=>item.email).join(", "),"All emails copied")}><Copy size={15} aria-hidden="true"/> Copy all emails</button>}</div>{notifyRequests.length === 0 ? <div className="empty-state"><b>No sign-ups yet</b><span>Emails from the Notify me form on coming-soon products appear here.</span></div> : <div className="license-table">{notifyRequests.map(item=><div key={item.id}><span><b>{item.email}</b><small>{item.product_name ?? "Unknown product"} · {new Date(item.created_at).toLocaleDateString()}</small></span><button type="button" className="button ghost" onClick={()=>void removeNotify(item)}>Remove</button></div>)}</div>}</div>}

      {tab === "orders" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={recordPayment}>
          <h2>Record a payment</h2>
          <p className="admin-hint">For money received outside the website, such as an M-Pesa transfer.</p>
          <label>Product<select name="product_id" required disabled={recordingPayment}><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <div className="two"><label>Paid with<select name="payment_method" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} disabled={recordingPayment}>{Object.entries(PAYMENT_METHODS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Transaction code<input name="provider_ref" required={paymentMethod !== "cash"} maxLength={60} placeholder="e.g. SJK4XY7Q2P" autoCapitalize="characters" disabled={recordingPayment}/></label></div>
          <div className="two"><label>Amount received<input name="amount" type="number" inputMode="decimal" min="0" step="0.01" required placeholder="65000" disabled={recordingPayment}/></label><label>Currency<select name="currency" defaultValue="TZS" disabled={recordingPayment}><option value="TZS">TZS (shillings)</option><option value="USD">USD</option></select></label></div>
          <label>Customer email<input name="customer_email" type="email" required disabled={recordingPayment}/></label>
          <label>Customer phone (optional)<input name="customer_phone" type="tel" inputMode="tel" placeholder="+255 7XX XXX XXX" disabled={recordingPayment}/></label>
          <div className="two"><label className="admin-check"><input type="checkbox" name="issue_license" defaultChecked disabled={recordingPayment}/> Issue the license now</label><label>Download limit<input name="max_downloads" type="number" defaultValue="5" min="1" max="100" disabled={recordingPayment}/></label></div>
          <button className="button primary" disabled={recordingPayment}>{recordingPayment ? "Saving…" : "Record payment"}</button>
          {orderLicense && issuedPanel(orderLicense, ()=>setOrderLicense(null))}
        </form>
        <div className="admin-card"><h2>Orders</h2>{orders.length === 0 ? <div className="empty-state"><b>No orders yet</b><span>Record an M-Pesa payment with the form, or wait for online checkout.</span></div> : <div className="license-table">{orders.map(order=><div key={order.id}>
          <span><b>{order.customer_email}</b><small>{order.product_name} · {new Date(order.created_at).toLocaleDateString()}{order.payment_method ? ` · ${PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS] ?? order.payment_method}` : ""}{order.provider_ref ? ` · ${order.provider_ref}` : ""}</small>{order.license_key && <code>{order.license_key}</code>}</span>
          <strong>{money(order.amount_cents, order.currency)}</strong>
          <em className={PAID_STATUSES.has(order.status) ? "published" : ""}>{order.status}</em>
          {PAID_STATUSES.has(order.status) && !order.license_id && <button type="button" onClick={()=>void issueOrderLicense(order)}><KeyRound size={15} aria-hidden="true"/> Issue license</button>}
          {order.license_id && order.license_key && <button type="button" className="button ghost" title={emailReady ? "Email key" : "Open in your email app"} aria-label={`Email license key to ${order.customer_email}`} disabled={sendingEmail === order.license_id} onClick={()=>void emailLicense({ id:order.license_id!, key:order.license_key!, email:order.customer_email, productName:order.product_name, maxDownloads:5 })}><Send size={15} aria-hidden="true"/></button>}
        </div>)}</div>}</div>
      </div>}
    </section>

    {editingDescriptions&&<DescriptionEditor product={editingDescriptions} onClose={()=>setEditingDescriptions(null)} onSaved={async()=>{await load();flash('Product descriptions saved');}}/>}
    {editingProduct&&<ProductEditor product={editingProduct} onClose={()=>setEditingProduct(null)} onSaved={async(text)=>{setEditingProduct(null);await load();flash(text);}}/>}
  </main>;
}

function ProductEditor({ product, onClose, onSaved }:{ product:Product; onClose:()=>void; onSaved:(message:string)=>Promise<void> }) {
  const [draft,setDraft]=useState({ name:product.name, slug:product.slug, category:product.category, price:(product.price_cents/100).toFixed(2), status:product.status, image:product.image, features:featureText(product.features) });
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  useEffect(() => {
    const onKey = (event:KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy,onClose]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const price_cents = toCents(draft.price);
    if (!Number.isFinite(price_cents)) { setError("Enter the price in US dollars, for example 29.00"); return; }
    if (draft.status === "published" && price_cents === 0 && !window.confirm("Publish this product as free? Anyone will be able to get it without paying.")) return;
    setBusy(true); setError("");
    try {
      // Description and translations stay as they are; they are edited under Translations.
      const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:draft.name, slug:draft.slug, category:draft.category, description:product.description, price_cents, status:draft.status, image:draft.image, features:splitFeatures(draft.features), checkout_url:product.checkout_url }) });
      const result = await response.json() as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Product could not be saved");
      await onSaved(`${draft.name} saved`);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Product could not be saved"); }
    finally { setBusy(false); }
  }

  return <div className="admin-dialog-backdrop" onClick={()=>{ if (!busy) onClose(); }}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="product-editor-title" dir="ltr" onClick={event=>event.stopPropagation()}>
    <button className="admin-dialog-close" type="button" aria-label="Close product editor" disabled={busy} onClick={onClose}><X size={18} aria-hidden="true"/></button>
    <h2 id="product-editor-title">Edit {product.name}</h2>
    <form className="admin-form" onSubmit={submit}>
      <label>Name<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} required maxLength={120} autoFocus/></label>
      <div className="two"><label>Slug (web address)<input value={draft.slug} onChange={e=>setDraft({...draft,slug:e.target.value})}/><small>Changing it changes the product page link.</small></label><label>Category<input value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}/></label></div>
      <div className="two"><label>Price (USD)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} required/></label><label>Status<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>{Object.entries(STATUS_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
      <label>Main image URL<input value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})} placeholder="/plugins/image.png or https://…"/><small>Or use Change image in the catalog to upload a file.</small></label>
      <label>Features (comma separated)<input value={draft.features} onChange={e=>setDraft({...draft,features:e.target.value})}/></label>
      <p className="admin-hint">Draft hides the product from the store. Products are not deleted here so existing customer licenses keep working.</p>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-form-actions"><button type="button" className="button ghost" disabled={busy} onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
    </form>
  </section></div>;
}
