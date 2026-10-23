"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import DescriptionEditor,{DescriptionFields} from './description-editor';
import type { DescriptionTranslations } from '@/lib/product-descriptions';
import type { AdminSection } from '@/lib/admin-navigation';

type Product = { id:string; slug:string; name:string; category:string; description:string; price_cents:number; status:string; image:string; features:string; checkout_url:string; gallery_images:string;description_translations?:string };
type Release = { id:string; product_id:string; product_name:string; version:string; file_name:string; file_size:number; is_active:number };
type License = { id:string; product_name:string; customer_email:string; license_key:string; status:string; download_count:number; max_downloads:number };
type Order = { id:string; product_name:string; customer_email:string; amount_cents:number; status:string; created_at:string };
type Tutorial = { id:string; product_name:string | null; title:string; description:string; file_name:string; file_size:number; is_published:number };
const empty = { name:"", slug:"", category:"Instrument", description:"", price_cents:2900, status:"draft", image:"/plugins/mlam-voice-midi.png", features:"", checkout_url:"", gallery_images:"",description_translations:{} as DescriptionTranslations };

function galleryText(value:string) { try { const parsed=JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item):item is string=>typeof item==='string').join("\n") : ""; } catch { return ""; } }

export default function AdminDashboard({ user, signOut,initialSection='overview' }:{ user:string; signOut:string;initialSection?:AdminSection }) {
  const [tab,setTab] = useState<string>(initialSection);
  const [products,setProducts] = useState<Product[]>([]);
  const [releases,setReleases] = useState<Release[]>([]);
  const [demos,setDemos] = useState<Release[]>([]);
  const [uploadingRelease,setUploadingRelease] = useState(false);
  const [licenses,setLicenses] = useState<License[]>([]);
  const [orders,setOrders] = useState<Order[]>([]);
  const [tutorials,setTutorials] = useState<Tutorial[]>([]);
  const [uploadingVideo,setUploadingVideo] = useState(false);
  const [videoMessage,setVideoMessage] = useState("");
  const [form,setForm] = useState(empty);
  const [message,setMessage] = useState("");
  const [imageFile,setImageFile] = useState<File | null>(null);
  const [imagePreview,setImagePreview] = useState("");
  const [savingProduct,setSavingProduct] = useState(false);
  const [updatingImage,setUpdatingImage] = useState<string | null>(null);
  const [editingDescriptions,setEditingDescriptions]=useState<Product|null>(null);
  const [galleryDrafts,setGalleryDrafts]=useState<Record<string,string>>({});
  const [savingGallery,setSavingGallery]=useState<string|null>(null);

  useEffect(() => {
    if (!imageFile) { setImagePreview(""); return; }
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  const load = useCallback(async () => {
    const read = async <T,>(url:string) => { const response = await fetch(url); if (!response.ok) throw new Error(response.status === 401 ? "Session expired. Sign in again at /admin." : "Unable to load administration data"); return await response.json() as T; };
    const [p,r,l,o,v,d] = await Promise.all([
      read<{ products?: Product[] }>("/api/products"), read<{ releases?: Release[] }>("/api/releases"),
      read<{ licenses?: License[] }>("/api/licenses"), read<{ orders?: Order[] }>("/api/orders"),
      read<{ tutorials?: Tutorial[] }>("/api/tutorials"),
      read<{ demos?: Release[] }>("/api/demos"),
    ]);
    setProducts(p.products ?? []); setGalleryDrafts(Object.fromEntries((p.products ?? []).map(product=>[product.id,galleryText(product.gallery_images ?? "[]")]))); setReleases(r.releases ?? []); setLicenses(l.licenses ?? []); setOrders(o.orders ?? []);
    setTutorials(v.tutorials ?? []);
    setDemos(d.demos ?? []);
  }, []);
  useEffect(() => { load().catch(error=>setMessage(error instanceof Error ? error.message : "Unable to load store data")); }, [load]);
  const flash = (text:string) => { setMessage(text); setTimeout(()=>setMessage(""),3500); };

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
    setSavingProduct(true);
    try {
      const image = imageFile ? await uploadProductImage(imageFile) : form.image;
      if (imageFile) { setForm(previous => ({...previous,image})); setImageFile(null); }
      const payload = { ...form, image, gallery_images:form.gallery_images.split(/\r?\n/).map(x=>x.trim()).filter(Boolean), features:form.features.split(",").map(x=>x.trim()).filter(Boolean) };
      const response = await fetch("/api/products", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const result = await response.json() as { error?:string };
      if (!response.ok) throw new Error(result.error ?? "Product could not be created");
      setForm(empty); setImageFile(null); element.reset(); await load(); flash("Product created with image");
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
      formElement.reset(); await load(); flash(demo ? "Demo ZIP uploaded. Activate it to enable Try." : "Licensed ZIP uploaded successfully");
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
    event.preventDefault(); const formElement = event.currentTarget; const data = Object.fromEntries(new FormData(formElement));
    const response = await fetch("/api/licenses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    const result = await response.json() as { license_key?: string; error?: string }; flash(response.ok ? `License: ${result.license_key}` : result.error ?? "License failed");
    if (response.ok) { formElement.reset(); await load(); }
  }

  async function activate(id:string) { await fetch(`/api/releases/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active:true}) }); flash("Release activated"); await load(); }
  async function activateDemo(item:Release) {
    const response = await fetch(`/api/demos/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({active:!item.is_active}) });
    flash(response.ok ? (item.is_active ? "Demo deactivated" : "Demo activated — Try is enabled for published products") : "Demo could not be updated");
    if (response.ok) await load();
  }
  async function toggleLicense(item:License) { await fetch(`/api/licenses/${item.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:item.status === "active" ? "revoked" : "active"}) }); await load(); }

  const metric = (title:string, value:string|number, detail:string, section:AdminSection) => <div key={title} role="button" tabIndex={0} title={`Open ${title}`} style={{cursor:"pointer"}} onClick={()=>setTab(section)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setTab(section);}}}><span>{title}</span><strong>{value}</strong><small>{detail} · Open section →</small></div>;

  const nav = [["overview","Overview","⌂"],["products","Products","◆"],["videos","Videos","▶"],["releases","Releases","⇧"],["licenses","Licenses","⌁"],["orders","Orders","≡"]];
  return <main className="admin-shell" dir="ltr">
    <aside className="admin-nav" aria-label="Administration sections"><a className="brand" href="/"><img src="/mlam-mark-3d-green.png" alt=""/><span><b>MLAM</b> STUDIO PRO<small>ADMINISTRATION</small></span></a><div className="admin-user"><i>{user.slice(0,1).toUpperCase()}</i><span><b>{user}</b><small>Website owner</small></span></div>{nav.map(([id,label,icon])=><button key={id} aria-label={label} aria-pressed={tab===id} title={label} className={tab===id?"active":""} onClick={()=>setTab(id)}><span aria-hidden="true">{icon}</span><span className="admin-nav-label">{label}</span></button>)}<a className="signout" href={signOut}>Sign out</a></aside>
    <section className="admin-main"><header><div><span className="kicker">MLAM STUDIO PRO ADMINISTRATION</span><h1>{tab[0].toUpperCase()+tab.slice(1)}</h1></div><a className="button ghost" href="/" target="_blank" rel="noopener">View website ↗</a></header>{message&&<div className="toast" role="status">{message}</div>}
    {tab==='overview'&&<div className="owner-upload-shortcuts" aria-label="Upload shortcuts"><button onClick={()=>setTab('products')}><strong>Products & pictures</strong><span>Add a plugin or change its artwork →</span></button><button onClick={()=>setTab('releases')}><strong>Plugin ZIPs</strong><span>Upload full versions and demos →</span></button><button onClick={()=>setTab('videos')}><strong>How to use videos</strong><span>Upload and publish tutorials →</span></button></div>}

    {tab === "overview" && <><div className="metric-grid">
      {metric("Products",products.length,`${products.filter(x=>x.status==="published").length} published`,"products")}
      {metric("Full plugin ZIPs",releases.filter(x=>x.is_active).length,`${releases.length} uploaded`,"releases")}
      {metric("Demo ZIPs",demos.filter(x=>x.is_active).length,`${demos.length} uploaded`,"releases")}
      {metric("Tutorial videos",tutorials.filter(x=>x.is_published).length,`${tutorials.length} uploaded`,"videos")}
      {metric("Licenses",licenses.length,`${licenses.filter(x=>x.status==="active").length} active`,"licenses")}
      {metric("Orders",orders.length,`$${(orders.reduce((sum,x)=>sum+x.amount_cents,0)/100).toFixed(0)} tracked`,"orders")}
    </div><div className="admin-card comments-status"><div><h2>Comments & replies</h2><p>Comment management has not been added yet.</p></div><span>Coming soon</span></div><div className="admin-card"><h2>Store workflow</h2><div className="pipeline"><div><b>1</b><span><strong>Create product</strong>Add price, image and copy.</span></div><i>→</i><div><b>2</b><span><strong>Upload ZIP</strong>Send a versioned release to secure storage.</span></div><i>→</i><div><b>3</b><span><strong>Issue license</strong>Customer downloads with a key.</span></div></div></div></>}

    {tab === "products" && <div className="split-admin"><form className="admin-card admin-form" onSubmit={addProduct}><h2>Add plugin</h2><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><div className="two"><label>Slug<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label><label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label></div><label>English description (default)<textarea lang="en" dir="ltr" maxLength={4000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><DescriptionFields includeEnglish={false} value={form.description_translations} onChange={description_translations=>setForm({...form,description_translations})} disabled={savingProduct}/>
      <fieldset className="product-image-editor" disabled={savingProduct}><legend>Product image</legend><img className="product-image-preview" src={imagePreview || form.image || "/plugins/mlam-voice-midi.png"} alt="Product image preview"/><label>Choose image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>setImageFile(event.target.files?.[0] ?? null)}/><small>PNG, JPG or WEBP · up to 10 MB. Uploads when you create the product.</small></label><label>Or image URL<input value={form.image} onChange={event=>{setForm({...form,image:event.target.value});setImageFile(null);}} placeholder="/plugins/image.png or https://…"/></label></fieldset>
      <label>Additional gallery image URLs<textarea value={form.gallery_images} onChange={event=>setForm({...form,gallery_images:event.target.value})} placeholder={'/plugins/image-2.png\nhttps://example.com/image-3.webp'} /><small>One image per line. Use a local path or an HTTPS image URL, up to 12 images.</small></label><div className="two"><label>Price cents<input type="number" value={form.price_cents} onChange={e=>setForm({...form,price_cents:Number(e.target.value)})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Draft</option><option value="published">Published</option><option value="coming-soon">Coming soon</option></select></label></div><label>Features (comma separated)<input value={form.features} onChange={e=>setForm({...form,features:e.target.value})}/></label><label>Checkout URL<input value={form.checkout_url} onChange={e=>setForm({...form,checkout_url:e.target.value})}/></label><button className="button primary" disabled={savingProduct}>{savingProduct ? "Saving product…" : "Create product"}</button></form><div className="admin-card"><h2>Catalog</h2><div className="admin-list">{products.map(product=><div key={product.id}><img src={product.image||"/plugins/mlam-voice-midi.png"} alt={`${product.name} image`}/><span><b>{product.name}</b><small>{product.category} · ${(product.price_cents/100).toFixed(0)}</small></span><em className={product.status}>{product.status}</em><button type="button" onClick={()=>setEditingDescriptions(product)}>Edit descriptions</button><label className="change-image-control">{updatingImage===product.id ? "Uploading…" : "Change image"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={updatingImage !== null} aria-label={`Change image for ${product.name}`} onChange={event=>{const file=event.target.files?.[0];if(file)void replaceImage(product,file);event.target.value="";}}/></label></div>)}</div><div className="product-gallery-editor"><h3>Product image galleries</h3><p>Add one image path or HTTPS image URL per line. The first image above remains the main image; these appear as selectable thumbnails.</p>{products.map(product=><div className="product-gallery-row" key={product.id}><label>{product.name}<textarea value={galleryDrafts[product.id] ?? ""} onChange={event=>setGalleryDrafts(previous=>({...previous,[product.id]:event.target.value}))} placeholder="/plugins/product-detail.webp" /></label><button className="button ghost" type="button" disabled={savingGallery===product.id} onClick={()=>void saveGalleryImages(product)}>{savingGallery===product.id ? "Saving…" : "Save gallery"}</button></div>)}</div></div></div>}

    {tab === "releases" && <div className="split-admin"><form className="admin-card admin-form" onSubmit={uploadRelease}><h2>Upload plugin ZIP</h2><label>Version type<select name="release_type" disabled={uploadingRelease}><option value="licensed">Full version — requires license</option><option value="demo">Demo — free Try download</option></select></label><label>Product<select name="product_id" required disabled={uploadingRelease}><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Version<input name="version" placeholder="1.0.0" required disabled={uploadingRelease}/></label><label>Release notes / demo limits<textarea name="notes" placeholder="What changed? What can the demo do?" disabled={uploadingRelease}/></label><label className="dropzone">ZIP file<input name="file" type="file" accept=".zip" required disabled={uploadingRelease}/><span>Choose the correct build. Demo ZIPs: up to 75 MB.</span></label><button className="button primary" disabled={uploadingRelease}>{uploadingRelease ? "Uploading ZIP…" : "Upload release"}</button></form><div className="admin-card"><h2>Full version releases</h2><div className="admin-list">{releases.map(release=><div key={release.id}><i className="file-icon">ZIP</i><span><b>{release.product_name} v{release.version}</b><small>{release.file_name} · {(release.file_size/1048576).toFixed(1)} MB</small></span>{release.is_active?<em className="published">ACTIVE</em>:<button onClick={()=>activate(release.id)}>Activate</button>}</div>)}</div><h2 className="demo-history-heading">Demo releases</h2><div className="admin-list">{demos.map(demo=><div key={demo.id}><i className="file-icon">DEMO</i><span><b>{demo.product_name} v{demo.version}</b><small>{demo.file_name} · {(demo.file_size/1048576).toFixed(1)} MB</small></span><em>{demo.is_active ? "ACTIVE" : "DRAFT"}</em><button onClick={()=>void activateDemo(demo)}>{demo.is_active ? "Deactivate" : "Activate demo"}</button></div>)}</div></div></div>}

    {tab === "licenses" && <div className="split-admin"><form className="admin-card admin-form" onSubmit={addLicense}><h2>Issue license</h2><label>Product<select name="product_id" required><option value="">Select product</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Customer email<input name="customer_email" type="email" required/></label><label>Download limit<input name="max_downloads" type="number" defaultValue="5" min="1"/></label><button className="button primary">Generate license</button></form><div className="admin-card"><h2>Customer licenses</h2><div className="license-table">{licenses.map(license=><div key={license.id}><span><b>{license.customer_email}</b><code>{license.license_key}</code><small>{license.product_name} · {license.download_count}/{license.max_downloads} downloads</small></span><button className={license.status} onClick={()=>toggleLicense(license)}>{license.status}</button></div>)}</div></div></div>}

    {tab === "videos" && <div className="split-admin"><form className="admin-card admin-form" onSubmit={uploadVideo}><h2>Upload How to use video</h2><fieldset className="video-upload-fields" disabled={uploadingVideo}><label>Product<select name="product_id"><option value="">General MLAM guide</option>{products.map(product=><option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Video title<input name="title" required maxLength={160} placeholder="How to use MLAM Imager"/></label><label>Description<textarea name="description" maxLength={2000} placeholder="What will the viewer learn?"/></label><label className="dropzone">Video file<input name="file" type="file" accept="video/mp4,video/webm,.mp4,.webm" required/><span>MP4 or WEBM · up to 50 MB</span></label><label className="publish-video-option"><input type="checkbox" name="published" defaultChecked/>Publish in How to use immediately</label><button className="button primary">{uploadingVideo ? "Uploading video…" : "Upload video"}</button></fieldset>{videoMessage && <p className="video-upload-message" role="status">{videoMessage}</p>}</form><div className="admin-card"><h2>Video library</h2><a className="details" href="/tutorials" target="_blank">View How to use ↗</a>{!tutorials.length ? <div className="empty-state"><b>No videos uploaded yet</b><span>Add your first product guide using the form.</span></div> : <div className="admin-video-list">{tutorials.map(item=><article key={item.id}><video controls playsInline preload="none" aria-label={item.title} src={`/api/tutorials/${item.id}/video`}/><h3>{item.title}</h3><p>{item.product_name ?? "General MLAM guide"} · {(item.file_size/1048576).toFixed(1)} MB</p><span>{item.is_published ? "Published" : "Draft / hidden"}</span><button className="button ghost" onClick={()=>void publishVideo(item)}>{item.is_published ? "Hide video" : "Publish video"}</button></article>)}</div>}</div></div>}
    {tab === "orders" && <div className="admin-card"><h2>Orders</h2>{orders.length === 0 ? <div className="empty-state"><b>No orders yet</b><span>Orders will appear here after checkout integration.</span></div> : <div className="license-table">{orders.map(order=><div key={order.id}><span><b>{order.customer_email}</b><small>{order.product_name} · {new Date(order.created_at).toLocaleDateString()}</small></span><strong>${(order.amount_cents/100).toFixed(2)}</strong><em>{order.status}</em></div>)}</div>}</div>}
    </section>{editingDescriptions&&<DescriptionEditor product={editingDescriptions} onClose={()=>setEditingDescriptions(null)} onSaved={async()=>{await load();flash('Product descriptions saved');}}/>}
  </main>;
}
