'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Light or dark Administration. Light is the default; the choice is kept per
// browser and applied before first paint by the inline script in app/layout.tsx.
export const ADMIN_THEME_KEY = 'mlam-admin-theme';
type AdminTheme = 'light' | 'dark';

export default function AdminThemeSwitch() {
  const [theme, setTheme] = useState<AdminTheme>('light');
  useEffect(() => { setTheme(document.documentElement.dataset.adminTheme === 'dark' ? 'dark' : 'light'); }, []);

  function choose(next: AdminTheme) {
    setTheme(next);
    if (next === 'dark') document.documentElement.dataset.adminTheme = 'dark';
    else delete document.documentElement.dataset.adminTheme;
    try { localStorage.setItem(ADMIN_THEME_KEY, next); } catch { /* private window: this visit only */ }
  }

  return (
    <div className="panel-mode-switch admin-theme-switch" role="group" aria-label="Admin colours">
      <button type="button" aria-pressed={theme === 'light'} onClick={() => choose('light')}><Sun size={15} aria-hidden="true" /><span>Light</span></button>
      <button type="button" aria-pressed={theme === 'dark'} onClick={() => choose('dark')}><Moon size={15} aria-hidden="true" /><span>Dark</span></button>
    </div>
  );
}
