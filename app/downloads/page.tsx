"use client";

import { useState, type FormEvent } from "react";

export default function DownloadsPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFailed(false);
    const key = licenseKey.trim().toUpperCase();
    if (!/^MLAM(?:-[A-Z0-9]{5}){4}$/.test(key)) {
      setFailed(true); setMessage("Check your license key. Use the complete MLAM key from your purchase."); return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/download", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        const errors: Record<string, string> = {
          "Invalid or inactive license": "This license is invalid or inactive. Check your key or contact support.",
          "License expired": "Your license has expired. Contact support for help.",
          "Download limit reached": "Your download limit has been reached. Contact support for help.",
          "No active release available": "The release ZIP is not available yet. Contact support for the release date.",
          "Release file not found": "The release ZIP is currently unavailable. Please contact support.",
        };
        throw new Error(errors[data.error ?? ""] ?? "Download could not start. Check your key or contact support.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "MLAM-plugin.zip";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setLicenseKey(""); setMessage("Your download is ready. Check your browser's downloads.");
    } catch (error) {
      setFailed(true); setMessage(error instanceof Error ? error.message : "Unable to connect. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="downloads-page">
    <header className="site-header"><a className="brand" href="/"><img src="/mlam-logo.png" alt="MLAM"/><span><b>MLAM</b> STUDIO PRO<small>CUSTOMER DOWNLOADS</small></span></a><nav><a href="/">Plugin store</a><a href="/#support">Support</a></nav></header>
    <section className="download-panel"><span className="kicker">YOUR STUDIO PRO</span><h1>Your sound.<br/><em>Your downloads.</em></h1><p>Enter the license key supplied with your purchase to download the active release ZIP for your plugin.</p>
      <form onSubmit={download}><label htmlFor="license-key">License key</label><input id="license-key" name="licenseKey" value={licenseKey} onChange={event => setLicenseKey(event.target.value)} placeholder="MLAM-XXXXX-XXXXX-XXXXX-XXXXX" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} required disabled={busy}/><button className="button primary" type="submit" disabled={busy}>{busy ? "Preparing download…" : "Download ZIP ↓"}</button></form>
      {message && <p className={`download-message ${failed ? "error" : "success"}`} role={failed ? "alert" : "status"}>{message}</p>}
      <div className="download-help"><h2>Need your license key?</h2><p>Check the purchase message from MLAM or <a href="mailto:melaninentertainment255@gmail.com?subject=MLAM%20download%20help">contact support</a>.</p><p>Bushman Bass, MLAM Piano and MLAM Studio Pro are coming soon. Their downloads will open with their releases.</p></div>
      <a className="button ghost" href="/">Back to plugin store</a>
    </section>
  </main>;
}
