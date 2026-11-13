"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import PanelModeSwitch from '@/components/ui/panel-mode-switch';
import { Check, Copy, ExternalLink, FileArchive, Image as ImageIcon, KeyRound, Languages, LayoutDashboard, LogOut, Mail, Package, Pencil, PlayCircle, Receipt, Search, Send, Trash2, X } from "lucide-react";
import DescriptionEditor,{DescriptionFields} from './description-editor';
import type { DescriptionTranslations } from '@/lib/product-descriptions';
import type { AdminSection } from '@/lib/admin-navigation';
import { licenseEmail } from '@/lib/email';
import { PAYMENT_METHODS } from '@/lib/manual-order';

type Product = { id:string; slug:string; name:string; category:string; description:string; price_cents:number; status:string; image:string; features:string; checkout_url:string; gallery_images:string;description_translations?:string };
type Release = { id:string; product_id:string; product_name:string; version:string; file_name:string; file_size:number; is_active:number };
type License = { id:string; product_id?:string; created_at?:string; product_name:string; customer_email:string; license_key:string; status:string; download_count:number; max_downloads:number };
type Order = { id:string; product_id:string; product_name:string; customer_email:string; customer_phone?:string; amount_cents:number; currency?:string; payment_method?:string; provider_ref?:string; status:string; created_at:string; license_id?:string|null; license_key?:string|null; max_downloads?:number };
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
  const [query,setQuery]=useState("");
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

  const paidOrders = orders.filter(order => PAID_STATUSES.has(order.status));

  // One search box in the top bar filters whichever list is open.
  const needle = query.trim().toLowerCase();
  const matches = (...values:(string|null|undefined)[]) => !needle || values.some(value => value?.toLowerCase().includes(needle));
  const filteredLicenses = licenses.filter(item => matches(item.customer_email, item.license_key, item.product_name));
  const shownProducts = products.filter(item => matches(item.name, item.category, item.slug));
  const shownOrders = orders.filter(item => matches(item.customer_email, item.product_name, item.provider_ref, item.license_key));
  const shownNotify = notifyRequests.filter(item => matches(item.email, item.product_name));

  // Overview figures.
  const overview = useMemo(() => {
    const now = Date.now(), day = 86400000;
    const within = (iso:string|undefined, from:number, to:number) => { const t = iso ? Date.parse(iso) : NaN; return t >= now - to * day && t < now - from * day; };
    const paid = orders.filter(order => PAID_STATUSES.has(order.status));
    const byCurrency = new Map<string,number>();
    for (const order of paid) byCurrency.set(order.currency || "USD", (byCurrency.get(order.currency || "USD") ?? 0) + order.amount_cents);
    const ranked = [...byCurrency].sort((a,b) => (b[0] === "TZS" ? 1 : 0) - (a[0] === "TZS" ? 1 : 0));
    const revenue = { main: ranked[0] ? money(ranked[0][1], ranked[0][0]) : money(0, "TZS"), other: ranked.slice(1).map(([c,v]) => money(v,c)).join(" + ") };
    const today = new Date();
    const months = Array.from({ length:12 }, (_,i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const inMonth = (iso?:string) => { if (!iso) return false; const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}` === key; };
      return { label: date.toLocaleString("en-US", { month:"short" }), orders: paid.filter(o => inMonth(o.created_at)).length, licenses: licenses.filter(l => inMonth(l.created_at)).length };
    });
    const rows = new Map<string,{ name:string; image:string; orders:number; licenses:number; totals:Map<string,number> }>();
    for (const order of paid) {
      const product = products.find(p => p.id === order.product_id);
      const row = rows.get(order.product_id) ?? { name: order.product_name ?? product?.name ?? "Product", image: product?.image ?? "", orders:0, licenses:0, totals:new Map() };
      row.orders++; row.totals.set(order.currency || "USD", (row.totals.get(order.currency || "USD") ?? 0) + order.amount_cents);
      rows.set(order.product_id, row);
    }
    for (const row of rows.values()) row.licenses = licenses.filter(l => l.product_name === row.name).length;
    const topProducts = [...rows.values()].sort((a,b) => b.orders - a.orders).slice(0,5).map(row => ({ ...row, revenue: [...row.totals].map(([c,v]) => money(v,c)).join(" + ") }));
    return {
      revenue, months, topProducts,
      ordersLast30: paid.filter(o => within(o.created_at, 0, 30)).length, ordersPrev30: paid.filter(o => within(o.created_at, 30, 60)).length,
      licensesLast30: licenses.filter(l => within(l.created_at, 0, 30)).length, licensesPrev30: licenses.filter(l => within(l.created_at, 30, 60)).length,
    };
  }, [orders, licenses, products]);
  const { revenue, months, topProducts, ordersLast30, ordersPrev30, licensesLast30, licensesPrev30 } = overview;
  const setupSteps: { label:string; done:boolean; section:AdminSection }[] = [
    { label:"Publish a product", done: products.some(p => p.status === "published"), section:"products" },
    { label:"Upload and activate a full-version ZIP", done: releases.some(r => r.is_active), section:"releases" },
    { label:"Add a How to use video", done: tutorials.some(t => t.is_published), section:"videos" },
    { label:"Issue the first license", done: licenses.length > 0, section:"licenses" },
  ];

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
    setAnnouncement({ productId, subject:`${name} is out now`, message:`Hi,\n\nYou asked us to tell you when ${name} launches. It is available now:\n${link}\n\n— BLACK-XPACE` });
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
  const statusPill = (status:string) => <span className={`adm-pill ${status}`}>{STATUS_LABELS[status]?.split(" (")[0] ?? status}</span>;
  const emptyState = (title:string, text:string) => <div className="empty-state"><b>{title}</b><span>{text}</span></div>;
  const searchPlaceholder = tab === "licenses" ? "Search email, key or product" : tab === "orders" ? "Search email, product or code" : tab === "notify" ? "Search email or product" : tab === "products" ? "Search products" : "Search products, orders, licenses";

  return <main className="adm-shell" dir="ltr">
    <aside className="adm-sidebar" aria-label="Administration sections">
      <a className="adm-brand" href="/"><img src="/mlam-mark-3d-green.png" alt=""/><span><b>BLACK-XPACE</b></span></a>
      <nav className="adm-nav">
        {NAV.map(({id,label,Icon})=><button key={id} type="button" aria-label={label} aria-current={tab===id ? "page" : undefined} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon size={18} strokeWidth={2} aria-hidden="true"/><span className="admin-nav-label">{label}</span>{id==="notify" && notifyRequests.length>0 && <i className="adm-count">{notifyRequests.length}</i>}</button>)}
      </nav>
      <div className="adm-sidebar-foot">
        <PanelModeSwitch />
        <a href="/" target="_blank" rel="noopener"><ExternalLink size={17} aria-hidden="true"/> View website</a>
        <a href={signOut}><LogOut size={17} aria-hidden="true"/> Sign out</a>
      </div>
    </aside>

    <div className="adm-main">
      <header className="adm-topbar">
        <h1>{current.label}</h1>
        {tab !== "videos" && tab !== "releases" && <label className="adm-search"><Search size={17} aria-hidden="true"/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label="Search"/></label>}
        <div className="adm-user"><span className="adm-avatar" aria-hidden="true">{user.slice(0,1).toUpperCase()}</span><span className="adm-user-text"><b>{user}</b><small>Website owner</small></span></div>
      </header>
      {message&&<div className="toast" role="status">{message}</div>}

      <section className="adm-content">
      {tab === "overview" && <div className="adm-overview">
        {setupSteps.some(step=>!step.done) && <div className="admin-card adm-setup"><h2>Finish setting up the store</h2><ol>{setupSteps.map(step=><li key={step.label} className={step.done?"done":""}><span aria-hidden="true">{step.done ? <Check size={14}/> : null}</span><button type="button" onClick={()=>setTab(step.section)}>{step.label}</button></li>)}</ol></div>}

        <div className="adm-kpis">
          <button type="button" className="adm-kpi" onClick={()=>setTab("orders")}><strong>{revenue.main}</strong><span>Revenue received</span>{revenue.other && <small>+ {revenue.other}</small>}</button>
          <button type="button" className="adm-kpi" onClick={()=>setTab("orders")}><strong>{paidOrders.length}</strong><span>Paid orders</span>{trend(ordersLast30, ordersPrev30)}</button>
          <button type="button" className="adm-kpi" onClick={()=>setTab("licenses")}><strong>{licenses.filter(x=>x.status==="active").length}</strong><span>Active licenses</span>{trend(licensesLast30, licensesPrev30)}</button>
          <button type="button" className="adm-kpi" onClick={()=>setTab("notify")}><strong>{notifyRequests.length}</strong><span>Waiting for launch</span><small>{new Set(notifyRequests.map(item=>item.product_id)).size} product{new Set(notifyRequests.map(item=>item.product_id)).size===1?"":"s"}</small></button>
        </div>

        <div className="admin-card adm-chart-card">
          <div className="adm-card-head"><h2>Orders and licenses, last 12 months</h2><div className="adm-legend"><span className="orders">Orders</span><span className="licenses">Licenses</span></div></div>
          <LineChart labels={months.map(m=>m.label)} series={[{ name:"Orders", className:"orders", values:months.map(m=>m.orders) },{ name:"Licenses", className:"licenses", values:months.map(m=>m.licenses) }]}/>
        </div>

        <div className="admin-card adm-donut-card">
          <div className="adm-card-head"><h2>Catalog status</h2><button type="button" className="adm-link" onClick={()=>setTab("products")}>Products</button></div>
          <Donut total={products.length} label="products" parts={[{ name:"On sale", className:"published", value:products.filter(x=>x.status==="published").length },{ name:"Coming soon", className:"coming-soon", value:products.filter(x=>x.status==="coming-soon").length },{ name:"Draft", className:"draft", value:products.filter(x=>x.status==="draft").length }]}/>
        </div>

        <div className="admin-card adm-top-card">
          <div className="adm-card-head"><h2>Top products</h2><button type="button" className="adm-link" onClick={()=>setTab("orders")}>All orders</button></div>
          {!topProducts.length ? emptyState("No sales yet","Record a payment under Orders and it shows up here.") :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Product</th><th className="num">Orders</th><th className="num">Licenses</th><th className="num">Revenue</th></tr></thead>
            <tbody>{topProducts.map(row=><tr key={row.name}><td><span className="adm-product-cell">{row.image ? <img src={row.image} alt=""/> : <span className="adm-thumb-empty" aria-hidden="true"/>}<b>{row.name}</b></span></td><td className="num">{row.orders}</td><td className="num">{row.licenses}</td><td className="num">{row.revenue}</td></tr>)}</tbody></table></div>}
        </div>

        <div className="admin-card adm-recent-card">
          <div className="adm-card-head"><h2>Recent orders</h2></div>
          {!orders.length ? emptyState("No orders yet","Payments you record appear here.") :
          <ul className="adm-recent">{orders.slice(0,5).map(order=><li key={order.id}><span><b>{order.customer_email}</b><small>{order.product_name} · {new Date(order.created_at).toLocaleDateString()}</small></span><strong>{money(order.amount_cents, order.currency)}</strong></li>)}</ul>}
        </div>
      </div>}

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
        <div className="admin-card"><div className="adm-card-head"><h2>Catalog</h2><span className="adm-muted">{shownProducts.length} of {products.length}</span></div>
          {!products.length ? emptyState("No products yet","Create your first plugin with the form.") : !shownProducts.length ? emptyState("No matches",`Nothing matches “${query}”.`) :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Product</th><th>Price</th><th>Status</th><th className="actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{shownProducts.map(product=><tr key={product.id}>
              <td><span className="adm-product-cell"><img src={product.image||"/mlam-mark-3d-green-512.png"} alt=""/><span><b>{product.name}</b><small>{product.category}</small></span></span></td>
              <td>{product.price_cents > 0 ? money(product.price_cents) : "Free"}</td>
              <td>{statusPill(product.status)}</td>
              <td className="actions"><div className="adm-row-actions">
                <button type="button" onClick={()=>setEditingProduct(product)}><Pencil size={14} aria-hidden="true"/> Edit</button>
                <button type="button" onClick={()=>setEditingDescriptions(product)}><Languages size={14} aria-hidden="true"/> Translations</button>
                <label className="change-image-control"><ImageIcon size={14} aria-hidden="true"/> {updatingImage===product.id ? "Uploading…" : "Image"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={updatingImage !== null} aria-label={`Change image for ${product.name}`} onChange={event=>{const file=event.target.files?.[0];if(file)void replaceImage(product,file);event.target.value="";}}/></label>
              </div></td>
            </tr>)}</tbody></table></div>}
          <details className="product-gallery-editor"><summary>Product image galleries</summary><p>Add one image path or HTTPS image URL per line. The main image stays first; these appear as selectable thumbnails.</p>{products.map(product=><div className="product-gallery-row" key={product.id}><label>{product.name}<textarea value={galleryDrafts[product.id] ?? ""} onChange={event=>setGalleryDrafts(previous=>({...previous,[product.id]:event.target.value}))} placeholder="/plugins/product-detail.webp" /></label><button className="button ghost" type="button" disabled={savingGallery===product.id} onClick={()=>void saveGalleryImages(product)}>{savingGallery===product.id ? "Saving…" : "Save gallery"}</button></div>)}</details>
        </div>
      </div>}

      {tab === "releases" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={uploadRelease}><h2>Upload plugin ZIP</h2><label>Version type<select name="release_type" disabled={uploadingRelease}><option value="licensed">Full version (requires license)</option><option value="demo">Demo (free Try download)</option></select></label><label>Product<select name="product_id" required disabled={uploadingRelease}><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Version<input name="version" placeholder="1.0.0" required disabled={uploadingRelease}/></label><label>Release notes / demo limits<textarea name="notes" placeholder="What changed? What can the demo do?" disabled={uploadingRelease}/></label><label className="dropzone">ZIP file<input name="file" type="file" accept=".zip" required disabled={uploadingRelease}/><span>Choose the correct build. Demo ZIPs: up to 75 MB.</span></label><button className="button primary" disabled={uploadingRelease}>{uploadingRelease ? "Uploading ZIP…" : "Upload release"}</button></form>
        <div className="admin-card">
          <div className="adm-card-head"><h2>Full versions</h2></div>
          {!releases.length ? emptyState("No full versions yet","Customers with a license can only download once a ZIP is uploaded and active.") :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Release</th><th className="num">Size</th><th>Status</th><th className="actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{releases.map(release=><tr key={release.id}><td><b>{release.product_name} v{release.version}</b><small>{release.file_name}</small></td><td className="num">{(release.file_size/1048576).toFixed(1)} MB</td><td>{release.is_active ? <span className="adm-pill published">Active</span> : <span className="adm-pill draft">Inactive</span>}</td><td className="actions"><div className="adm-row-actions">{!release.is_active && <button type="button" onClick={()=>void activate(release.id)}>Activate</button>}<button type="button" className="danger" aria-label={`Delete ${release.product_name} v${release.version}`} onClick={()=>void deleteFile("release",release.id,`${release.product_name} v${release.version}`)}><Trash2 size={15} aria-hidden="true"/></button></div></td></tr>)}</tbody></table></div>}
          <div className="adm-card-head adm-subhead"><h2>Demos</h2></div>
          {!demos.length ? emptyState("No demos yet","Upload a demo ZIP to show Try free demo on the product page.") :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Demo</th><th className="num">Size</th><th>Status</th><th className="actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{demos.map(demo=><tr key={demo.id}><td><b>{demo.product_name} v{demo.version}</b><small>{demo.file_name}</small></td><td className="num">{(demo.file_size/1048576).toFixed(1)} MB</td><td>{demo.is_active ? <span className="adm-pill published">Active</span> : <span className="adm-pill draft">Draft</span>}</td><td className="actions"><div className="adm-row-actions"><button type="button" onClick={()=>void activateDemo(demo)}>{demo.is_active ? "Deactivate" : "Activate"}</button><button type="button" className="danger" aria-label={`Delete demo ${demo.product_name} v${demo.version}`} onClick={()=>void deleteFile("demo",demo.id,`Demo ${demo.product_name} v${demo.version}`)}><Trash2 size={15} aria-hidden="true"/></button></div></td></tr>)}</tbody></table></div>}
        </div>
      </div>}

      {tab === "licenses" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={addLicense}><h2>Issue license</h2><label>Product<select name="product_id" required disabled={issuingLicense}><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Customer email<input name="customer_email" type="email" required disabled={issuingLicense}/></label><label>Download limit<input name="max_downloads" type="number" defaultValue="5" min="1" disabled={issuingLicense}/></label><button className="button primary" disabled={issuingLicense}>{issuingLicense ? "Generating…" : "Generate license"}</button>
          {newLicense && issuedPanel(newLicense, ()=>setNewLicense(null))}
        </form>
        <div className="admin-card"><div className="adm-card-head"><h2>Customer licenses</h2><span className="adm-muted">{filteredLicenses.length} of {licenses.length}</span></div>
          {!licenses.length ? emptyState("No licenses yet","Issue a license with the form after a customer pays.") : !filteredLicenses.length ? emptyState("No matches",`Nothing matches “${query}”.`) :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Customer</th><th>Product</th><th className="num">Downloads</th><th>Status</th><th className="actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{filteredLicenses.map(license=><tr key={license.id}>
              <td><b>{license.customer_email}</b><code>{license.license_key}</code></td>
              <td>{license.product_name}</td>
              <td className="num">{license.download_count}/{license.max_downloads}</td>
              <td>{license.status === "active" ? <span className="adm-pill published">Active</span> : <span className="adm-pill revoked">Revoked</span>}</td>
              <td className="actions"><div className="adm-row-actions">
                <button type="button" aria-label={`Copy license key for ${license.customer_email}`} title="Copy key" onClick={()=>void copy(license.license_key,"License key copied")}><Copy size={15} aria-hidden="true"/></button>
                {license.status === "active" && <button type="button" aria-label={`Email license key to ${license.customer_email}`} title={emailReady ? "Email key" : "Open in your email app"} disabled={sendingEmail === license.id} onClick={()=>void emailLicense({ id:license.id, key:license.license_key, email:license.customer_email, productName:license.product_name, maxDownloads:license.max_downloads })}><Send size={15} aria-hidden="true"/></button>}
                <button type="button" className={license.status === "active" ? "danger" : ""} onClick={()=>void toggleLicense(license)}>{license.status === "active" ? "Revoke" : "Restore"}</button>
              </div></td>
            </tr>)}</tbody></table></div>}
        </div>
      </div>}

      {tab === "videos" && <div className="split-admin">
        <form className="admin-card admin-form" onSubmit={uploadVideo}><h2>Upload How to use video</h2><fieldset className="video-upload-fields" disabled={uploadingVideo}><label>Product<select name="product_id"><option value="">General MLAM guide</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Video title<input name="title" required maxLength={160} placeholder="How to use MLAM Imager"/></label><label>Description<textarea name="description" maxLength={2000} placeholder="What will the viewer learn?"/></label><label className="dropzone">Video file<input name="file" type="file" accept="video/mp4,video/webm,.mp4,.webm" required/><span>MP4 or WEBM · up to 50 MB</span></label><label className="publish-video-option"><input type="checkbox" name="published" defaultChecked/>Publish in How to use immediately</label><button className="button primary">{uploadingVideo ? "Uploading video…" : "Upload video"}</button></fieldset>{videoMessage && <p className="video-upload-message" role="status">{videoMessage}</p>}</form>
        <div className="admin-card"><div className="adm-card-head"><h2>Video library</h2><a className="adm-link" href="/tutorials" target="_blank" rel="noopener">View How to use <ExternalLink size={13} aria-hidden="true"/></a></div>{!tutorials.length ? emptyState("No videos uploaded yet","Until you upload one, How to use shows Coming soon guides.") : <div className="admin-video-list">{tutorials.map(item=><article key={item.id}><video controls playsInline preload="none" aria-label={item.title} src={`/api/tutorials/${item.id}/video`}/><h3>{item.title}</h3><p>{item.product_name ?? "General MLAM guide"} · {(item.file_size/1048576).toFixed(1)} MB</p>{item.is_published ? <span className="adm-pill published">Published</span> : <span className="adm-pill draft">Hidden</span>}<div className="admin-video-actions"><button type="button" className="button ghost" onClick={()=>void publishVideo(item)}>{item.is_published ? "Hide video" : "Publish video"}</button><button type="button" className="button ghost danger" onClick={()=>void deleteFile("video",item.id,`Video "${item.title}"`)}><Trash2 size={15} aria-hidden="true"/> Delete</button></div></article>)}</div>}</div>
      </div>}

      {tab === "notify" && <div className="split-admin">
        {notifyRequests.length ? <form className="admin-card admin-form" onSubmit={sendAnnouncement}>
          <h2>Launch announcement</h2>
          <label>Product<select required value={announcement.productId} onChange={e=>startAnnouncement(e.target.value)}><option value="">Select product</option>{[...new Set(notifyRequests.map(item=>item.product_id))].map(id=>{ const count=notifyRequests.filter(item=>item.product_id===id).length; return <option key={id} value={id}>{notifyRequests.find(item=>item.product_id===id)?.product_name ?? id} ({count} waiting)</option>; })}</select></label>
          <label>Subject<input required maxLength={150} value={announcement.subject} onChange={e=>setAnnouncement({...announcement,subject:e.target.value})}/></label>
          <label>Message<textarea required maxLength={5000} rows={7} value={announcement.message} onChange={e=>setAnnouncement({...announcement,message:e.target.value})}/></label>
          <p className="admin-hint">{emailReady ? "Each person gets their own email, so nobody sees the other addresses." : "Email sending is not set up, so this opens your email app with everyone in BCC. Add RESEND_API_KEY to send from here."}</p>
          <button className="button primary" disabled={!announcement.productId || sendingEmail === "announcement"}><Send size={15} aria-hidden="true"/> {sendingEmail === "announcement" ? "Sending…" : emailReady ? `Send to ${notifyRequests.filter(item=>item.product_id===announcement.productId).length || ""} people` : "Open in email app"}</button>
        </form> : <div className="admin-card">{emptyState("No announcement to send","When people press Notify me on a coming-soon product, you can email them all from here.")}</div>}
        <div className="admin-card"><div className="adm-card-head"><h2>Launch list</h2>{!!notifyRequests.length && <button type="button" className="button ghost" onClick={()=>void copy(notifyRequests.map(item=>item.email).join(", "),"All emails copied")}><Copy size={15} aria-hidden="true"/> Copy all emails</button>}</div>
          {notifyRequests.length === 0 ? emptyState("No sign-ups yet","Emails from the Notify me form on coming-soon products appear here.") : !shownNotify.length ? emptyState("No matches",`Nothing matches “${query}”.`) :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Email</th><th>Product</th><th>Signed up</th><th className="actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{shownNotify.map(item=><tr key={item.id}><td><b>{item.email}</b></td><td>{item.product_name ?? "Unknown product"}</td><td>{new Date(item.created_at).toLocaleDateString()}</td><td className="actions"><div className="adm-row-actions"><button type="button" onClick={()=>void removeNotify(item)}>Remove</button></div></td></tr>)}</tbody></table></div>}
        </div>
      </div>}

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
        <div className="admin-card"><div className="adm-card-head"><h2>Orders</h2><span className="adm-muted">{shownOrders.length} of {orders.length}</span></div>
          {orders.length === 0 ? emptyState("No orders yet","Record an M-Pesa payment with the form, or wait for online checkout.") : !shownOrders.length ? emptyState("No matches",`Nothing matches “${query}”.`) :
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Customer</th><th>Payment</th><th className="num">Amount</th><th>License</th><th className="actions"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{shownOrders.map(order=><tr key={order.id}>
              <td><b>{order.customer_email}</b><small>{order.product_name} · {new Date(order.created_at).toLocaleDateString()}</small>{order.license_key && <code>{order.license_key}</code>}</td>
              <td>{order.payment_method ? (PAYMENT_METHODS[order.payment_method as keyof typeof PAYMENT_METHODS] ?? order.payment_method) : "Online"}<small>{order.provider_ref}</small></td>
              <td className="num"><b>{money(order.amount_cents, order.currency)}</b></td>
              <td>{order.license_key ? <span className="adm-pill published">Issued</span> : PAID_STATUSES.has(order.status) ? <span className="adm-pill coming-soon">Not issued</span> : <span className="adm-pill draft">{order.status}</span>}</td>
              <td className="actions"><div className="adm-row-actions">
                {PAID_STATUSES.has(order.status) && !order.license_id && <button type="button" onClick={()=>void issueOrderLicense(order)}><KeyRound size={14} aria-hidden="true"/> Issue license</button>}
                {order.license_key && <button type="button" title="Copy key" aria-label={`Copy license key for ${order.customer_email}`} onClick={()=>void copy(order.license_key!,"License key copied")}><Copy size={15} aria-hidden="true"/></button>}
                {order.license_id && order.license_key && <button type="button" title={emailReady ? "Email key" : "Open in your email app"} aria-label={`Email license key to ${order.customer_email}`} disabled={sendingEmail === order.license_id} onClick={()=>void emailLicense({ id:order.license_id!, key:order.license_key!, email:order.customer_email, productName:order.product_name, maxDownloads:order.max_downloads ?? 5 })}><Send size={15} aria-hidden="true"/></button>}
              </div></td>
            </tr>)}</tbody></table></div>}
        </div>
      </div>}
      </section>
    </div>

    {editingDescriptions&&<DescriptionEditor product={editingDescriptions} onClose={()=>setEditingDescriptions(null)} onSaved={async()=>{await load();flash('Product descriptions saved');}}/>}
    {editingProduct&&<ProductEditor product={editingProduct} onClose={()=>setEditingProduct(null)} onSaved={async(text)=>{setEditingProduct(null);await load();flash(text);}}/>}
  </main>;
}

function trend(current:number, previous:number) {
  if (!current && !previous) return <small>No change in 30 days</small>;
  if (!previous) return <small className="adm-delta up">New in last 30 days</small>;
  const change = Math.round(((current - previous) / previous) * 100);
  return <small className={`adm-delta ${change >= 0 ? "up" : "down"}`}>{change >= 0 ? "+" : ""}{change}% vs previous 30 days</small>;
}

// Small dependency-free SVG charts sized by their container.
function LineChart({ labels, series }:{ labels:string[]; series:{ name:string; className:string; values:number[] }[] }) {
  const width = 640, height = 220, left = 32, right = 12, top = 12, bottom = 28;
  const max = Math.max(4, ...series.flatMap(s => s.values));
  const step = Math.ceil(max / 4);
  const ceiling = step * 4;
  const x = (i:number) => left + (i * (width - left - right)) / Math.max(1, labels.length - 1);
  const y = (v:number) => top + (1 - v / ceiling) * (height - top - bottom);
  const path = (values:number[]) => values.map((v,i) => {
    if (i === 0) return `M${x(0)},${y(v)}`;
    const cx = (x(i-1) + x(i)) / 2;
    return `C${cx},${y(values[i-1])} ${cx},${y(v)} ${x(i)},${y(v)}`;
  }).join(" ");
  const hasData = series.some(s => s.values.some(Boolean));
  return <div className="adm-chart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${series.map(s=>`${s.name}: ${s.values.reduce((a,b)=>a+b,0)}`).join(", ")} in the last 12 months`}>
      {[0,1,2,3,4].map(i => <g key={i}><line className="grid" x1={left} x2={width-right} y1={y(i*step)} y2={y(i*step)}/><text className="axis" x={left-8} y={y(i*step)+4} textAnchor="end">{i*step}</text></g>)}
      {labels.map((label,i) => <text key={label+i} className="axis" x={x(i)} y={height-8} textAnchor="middle">{label}</text>)}
      {series.map(s => <g key={s.name} className={s.className}>
        <path className="line" d={path(s.values)}/>
        {s.values.map((v,i) => v > 0 && <circle key={i} className="dot" cx={x(i)} cy={y(v)} r="3.5"><title>{`${labels[i]}: ${v} ${s.name.toLowerCase()}`}</title></circle>)}
      </g>)}
    </svg>
    {!hasData && <p className="adm-chart-empty">No orders or licenses in the last 12 months yet.</p>}
  </div>;
}

function Donut({ parts, total, label }:{ parts:{ name:string; className:string; value:number }[]; total:number; label:string }) {
  const radius = 54, circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <div className="adm-donut">
    <svg viewBox="0 0 140 140" role="img" aria-label={parts.map(p=>`${p.name}: ${p.value}`).join(", ")}>
      <circle className="track" cx="70" cy="70" r={radius}/>
      {total > 0 && parts.filter(p=>p.value>0).map(p => {
        const length = (p.value / total) * circumference;
        const segment = <circle key={p.name} className={`seg ${p.className}`} cx="70" cy="70" r={radius} strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)"/>;
        offset += length;
        return segment;
      })}
      <text x="70" y="68" textAnchor="middle" className="total">{total}</text>
      <text x="70" y="86" textAnchor="middle" className="caption">{label}</text>
    </svg>
    <ul className="adm-donut-legend">{parts.map(p=><li key={p.name}><span className={`dot ${p.className}`} aria-hidden="true"/>{p.name}<b>{p.value}</b></li>)}</ul>
  </div>;
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
