"use client";

import Link from "next/link";
import { useLanguage } from "@/app/language-provider";
import { languageOptions } from "@/lib/languages";

// "Big wordmark" footer: link columns and socials on top, the BLACK-XPACE
// name in large faded letters, then copyright, legal links and the
// site-wide language picker. 980px wide like the homepage sections.
const columns = [
  { title: "Plugins", links: [["All plugins", "/plugins"], ["Voice MIDI", "/plugins/voice-midi"], ["Bushman Bass", "/plugins/bushman-bass"], ["DAW", "/plugins/mlam-daw"]] },
  { title: "Help", links: [["Video guides", "/tutorials"], ["Downloads", "/downloads"], ["My account", "/account"], ["Support", "/contact"]] },
  { title: "Company", links: [["About", "/about"], ["Licence", "/licence"], ["Privacy", "/privacy"], ["Contact", "/contact"]] },
];

const socials = [
  { label: "Instagram", href: "https://instagram.com", path: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>, stroke: true },
  { label: "YouTube", href: "https://youtube.com", path: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /> },
  { label: "X (Twitter)", href: "https://x.com", path: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
  { label: "LinkedIn", href: "https://linkedin.com", path: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /> },
];

export default function ModernFooter() {
  const { language, setLanguage } = useLanguage();

  return (
    <footer className="bx-footer">
      <div className="bx-footer-inner">
        <div className="bx-footer-top">
          <nav className="bx-footer-cols" aria-label="Footer">
            {columns.map((column) => (
              <div className="bx-footer-col" key={column.title}>
                <h4 className="bx-footer-heading">{column.title}</h4>
                <ul>
                  {column.links.map(([label, href]) => (
                    <li key={label}><Link href={href}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="bx-footer-socials">
            {socials.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"
                  fill={social.stroke ? "none" : "currentColor"} stroke={social.stroke ? "currentColor" : undefined}
                  strokeWidth={social.stroke ? 2 : undefined} strokeLinecap="round" strokeLinejoin="round">
                  {social.path}
                </svg>
              </a>
            ))}
          </div>
        </div>

        <p className="bx-footer-wordmark" aria-hidden="true">BLACK-XPACE</p>

        <div className="bx-footer-bottom">
          <span>© 2026 BLACK-XPACE · Dar es Salaam, Tanzania</span>
          <div className="bx-footer-bottom-right">
            <Link href="/licence">Licence</Link>
            <Link href="/privacy">Privacy</Link>
            <label className="bx-footer-language">
              <span className="sr-only">Language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Select language">
                {languageOptions.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </footer>
  );
}
