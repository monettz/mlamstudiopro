import type { ReactNode } from 'react';
import ModernNav from '@/components/ui/modern-nav';
import ModernFooter from '@/components/ui/modern-footer';

// Shared layout for the About, Licence, Privacy and Contact pages: the site
// navigation, a centred header and a column of readable content sections.
export default function InfoPage({ kicker, title, intro, updated, activeTab, children }: {
  kicker: string;
  title: ReactNode;
  intro: ReactNode;
  updated?: string;
  activeTab?: string;
  children: ReactNode;
}) {
  return (
    <div className="subpage-wrapper">
      <ModernNav activeTab={activeTab} />
      <main className="info-page">
        <header className="info-header">
          <span className="showcase-kicker">{kicker}</span>
          <h1 className="subpage-title">{title}</h1>
          <p className="subpage-subtitle">{intro}</p>
          {updated && <p className="info-updated">Last updated {updated}</p>}
        </header>
        <div className="info-body">{children}</div>
      </main>
      <ModernFooter />
    </div>
  );
}

export function InfoSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section className="info-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
