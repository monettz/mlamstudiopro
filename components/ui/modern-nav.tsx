"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/language-provider";

interface ModernNavProps {
  activeTab?: string;
  /**
   * Overlay mode: the header floats transparently over a full-bleed hero
   * (home page) and no layout spacer is rendered. Other pages get a spacer
   * so content never slides under the fixed header.
   */
  overlay?: boolean;
}

const SCROLL_THRESHOLD = 12;

export default function ModernNav({ activeTab, overlay = false }: ModernNavProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: "Home", href: "/", id: "home" },
    { label: t("plugins") || "Plugins", href: "/#plugins", id: "plugins" },
    { label: t("daw") || "DAW", href: "/#studio", id: "daw" },
    { label: t("guides") || "How to use", href: "/tutorials", id: "guides" },
    { label: t("downloads") || "Downloads", href: "/downloads", id: "downloads" },
  ];

  // Header stays fixed; after a small scroll it gains a solid glass background.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock page scroll and support Escape while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const headerClass = [
    "mn-header",
    scrolled || menuOpen ? "is-scrolled" : "",
    overlay ? "is-overlay" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <header className={headerClass}>
        <nav className="mn-bar" aria-label="Primary">
          <Link className="mn-brand" href="/" aria-label="MLAM Studio Pro home">
            <img src="/mlam-mark-3d-green-512.png" alt="" width={32} height={32} className="mn-brand-mark" />
            <span className="mn-brand-text">
              <b>MLAM</b> <span>STUDIO PRO</span>
            </span>
          </Link>

          <div className="sh-capsule mn-capsule">
            {links.map((link) => (
              <Link
                key={link.id}
                className={`sh-capsule-item ${activeTab === link.id ? "active" : ""}`}
                aria-current={activeTab === link.id ? "page" : undefined}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
            <Link className="sh-capsule-cta" href="/account">
              <span>{t("account") || "Account"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          </div>

          <button
            type="button"
            className="mn-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mn-mobile-menu"
          >
            <span className={`mn-toggle-icon ${menuOpen ? "open" : ""}`} aria-hidden="true">
              <i /><i /><i />
            </span>
          </button>
        </nav>
      </header>

      {menuOpen && (
        <div id="mn-mobile-menu" className="mn-mobile" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="mn-mobile-links">
            {links.map((link) => (
              <Link
                key={link.id}
                className={`mn-mobile-item ${activeTab === link.id ? "active" : ""}`}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                <span>{link.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
            <Link className="mn-mobile-cta" href="/account" onClick={() => setMenuOpen(false)}>
              {t("account") || "Account"} ↗
            </Link>
          </div>
        </div>
      )}

      {!overlay && <div className="mn-spacer" aria-hidden="true" />}
    </>
  );
}
