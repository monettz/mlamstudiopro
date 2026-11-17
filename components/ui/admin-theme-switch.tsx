'use client';
import { useEffect, useState } from 'react';
import { Layers, Moon, Sun } from 'lucide-react';

// Admin colours: Light (default) or Dark, plus an optional Glass look on top
// of either. Kept per browser and applied before first paint by the inline
// script in app/layout.tsx.
export const ADMIN_THEME_KEY = 'mlam-admin-theme';
export const ADMIN_GLASS_KEY = 'mlam-admin-glass';
type AdminTheme = 'light' | 'dark';

function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private window: this visit only */ }
}

export default function AdminThemeSwitch() {
  const [theme, setTheme] = useState<AdminTheme>('light');
  const [glass, setGlass] = useState(false);
  useEffect(() => {
    const root = document.documentElement.dataset;
    setTheme(root.adminTheme === 'dark' ? 'dark' : 'light');
    setGlass(root.adminGlass === 'on');
  }, []);

  function chooseTheme(next: AdminTheme) {
    setTheme(next);
    if (next === 'dark') document.documentElement.dataset.adminTheme = 'dark';
    else delete document.documentElement.dataset.adminTheme;
    save(ADMIN_THEME_KEY, next);
  }

  function toggleGlass() {
    const next = !glass;
    setGlass(next);
    if (next) document.documentElement.dataset.adminGlass = 'on';
    else delete document.documentElement.dataset.adminGlass;
    save(ADMIN_GLASS_KEY, next ? 'on' : 'off');
  }

  return (
    <div className="admin-theme-controls">
      <div className="panel-mode-switch admin-theme-switch" role="group" aria-label="Admin colours">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => chooseTheme('light')}><Sun size={15} aria-hidden="true" /><span>Light</span></button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => chooseTheme('dark')}><Moon size={15} aria-hidden="true" /><span>Dark</span></button>
      </div>
      <button type="button" className="admin-glass-toggle" role="switch" aria-checked={glass} onClick={toggleGlass}>
        <Layers size={15} aria-hidden="true" /><span>Glass</span><span className="admin-glass-knob" aria-hidden="true" />
      </button>
    </div>
  );
}
