"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/language-provider";
import { languageOptions } from "@/lib/languages";

export default function ModernFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { language, setLanguage } = useLanguage();

  const currentLanguageName =
    languageOptions.find((opt) => opt.code === language)?.name || "English";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 4500);
  };

  return (
    <footer className="tailark-footer">
      <div className="tailark-footer-inner">
        {/* Top Brand Row */}
        <div className="tailark-brand-row">
          <div className="tailark-brand">
            <img src="/mlam-mark-3d-green-512.png" alt="MLAM Studio Pro" className="tailark-brand-logo" />
            <span className="tailark-brand-name">
              MLAM <span>STUDIO PRO</span>
            </span>
          </div>
          <p className="tailark-location">
            Dar es Salaam, Tanzania · Built for Producers worldwide
          </p>
          <div className="tailark-socials">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Dotted Separator */}
        <div className="tailark-dotted-divider" />

        {/* 4 Columns */}
        <div className="tailark-columns">
          {/* Column 1: Product */}
          <div className="tailark-col">
            <h4 className="tailark-heading">Product</h4>
            <ul className="tailark-links">
              <li><Link href="/#plugins">Features</Link></li>
              <li><Link href="/#voice-midi">Voice MIDI</Link></li>
              <li><Link href="/#plugins">Bushman Bass</Link></li>
              <li><Link href="/#studio">MLAM DAW</Link></li>
              <li><Link href="/#plugins">Sound Library</Link></li>
            </ul>
          </div>

          {/* Column 2: Resources */}
          <div className="tailark-col">
            <h4 className="tailark-heading">Resources</h4>
            <ul className="tailark-links">
              <li><Link href="/tutorials">Tutorials & Guides</Link></li>
              <li><Link href="/downloads">Customer Downloads</Link></li>
              <li><Link href="/tutorials">Documentation</Link></li>
              <li><Link href="/#support">Support Hub</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="tailark-col">
            <h4 className="tailark-heading">Company</h4>
            <ul className="tailark-links">
              <li><Link href="/#support">About MLAM</Link></li>
              <li><Link href="/downloads">Licence</Link></li>
              <li><Link href="/#support">Privacy</Link></li>
              <li><a href="mailto:melaninentertainment255@gmail.com">Contact</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="tailark-col tailark-newsletter-col">
            <h4 className="tailark-heading">Subscribe to our newsletter</h4>
            {subscribed ? (
              <div className="tailark-subscribed-msg">
                ✓ Thank you for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="tailark-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="tailark-input"
                />
                <button type="submit" className="tailark-btn">
                  Subscribe
                </button>
              </form>
            )}
            <p className="tailark-newsletter-hint">
              Get the latest product news and behind the scenes updates. Unsubscribe at any time.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="tailark-bottom-bar">
          <span className="tailark-copyright">
            © 2026 MLAM Studio Pro, All rights reserved
          </span>

          <div className="tailark-bottom-actions">
            {/* Language Selector Capsule (as requested) */}
            <div className="tailark-language-pill" title="Change language">
              {/* Globe Icon in Cyan/Blue styling */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="tailark-globe-icon"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>

              <span className="tailark-language-name">{currentLanguageName}</span>

              {/* Chevron Down */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="tailark-chevron-icon"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>

              {/* Native select overlay for universal compatibility and instant reactivity */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select Language"
                className="tailark-language-select"
              >
                {languageOptions.map(({ code, name }) => (
                  <option key={code} value={code} style={{ background: '#121215', color: '#ffffff' }}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pill */}
            <div className="tailark-status-pill">
              <span className="tailark-status-dot" />
              <span>All Systems Normal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
