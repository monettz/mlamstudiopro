"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/app/language-provider";

interface ModernNavProps {
  activeTab?: string;
}

export default function ModernNav({ activeTab }: ModernNavProps) {
  const { t } = useLanguage();

  const links = [
    { label: "Home", href: "/", id: "home" },
    { label: t("plugins") || "Plugins", href: "/#plugins", id: "plugins" },
    { label: t("daw") || "DAW", href: "/#studio", id: "daw" },
    { label: t("guides") || "How to use", href: "/tutorials", id: "guides" },
    { label: t("downloads") || "Downloads", href: "/downloads", id: "downloads" },
  ];

  return (
    <header className="modern-nav-wrapper">
      <nav className="sh-nav" aria-label="Primary">
        <div className="sh-nav-left">
          <Link className="sh-brand" href="/" style={{ textDecoration: "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "#ffffff" }}>
              <img
                src="/mlam-mark-3d-green-512.png"
                alt="MLAM"
                style={{
                  width: "32px",
                  height: "32px",
                  objectFit: "contain",
                  filter: "drop-shadow(0 2px 8px rgba(74, 222, 128, 0.4))",
                }}
              />
              <span style={{ letterSpacing: "-0.02em", fontSize: "16.5px", opacity: 0.75 }}>
                <span style={{ fontWeight: 800 }}>MLAM</span> <span style={{ fontWeight: 400 }}>STUDIO PRO</span>
              </span>
            </span>
          </Link>
        </div>

        <div className="sh-nav-center">
          <div className="sh-capsule">
            {links.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <Link
                  key={link.id}
                  className={`sh-capsule-item ${isActive ? "active" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link className="sh-capsule-cta" href="/account">
              <span>{t("account") || "Account"}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: "4px" }}
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="sh-nav-right" />
      </nav>
    </header>
  );
}
