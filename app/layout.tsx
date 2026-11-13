import type { Metadata } from "next";
import "./globals.css";
import "./responsive.css";
import "./account.css";
import { cookies } from 'next/headers';
import { validLanguage,languageDirection } from '@/lib/languages';
import LanguageProvider from './language-provider';
import ScrollReveal from './scroll-reveal';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.MLAM_ORIGIN || 'http://127.0.0.1:4180'),
  title: "BLACK-XPACE — Plugins, Instruments & Effects",
  description: "Original MLAM plugins for producers: instruments, MIDI tools and audio effects.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "BLACK-XPACE",
    description: "Turn inspiration into sound with MLAM instruments and effects.",
    type: "website",
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "MLAM Plugin Store" }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language=validLanguage((await cookies()).get('mlam_language')?.value);
  return (
    <html lang={language} dir={languageDirection(language)} data-panel-mode="glass" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Jost:wght@800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        {/* Apply the saved dashboard style (glass/solid) before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('mlam-panel-mode')==='solid')document.documentElement.dataset.panelMode='solid'}catch(e){}" }} />
      </head>
      <body>
        <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
        <ScrollReveal />
      </body>
    </html>
  );
}
