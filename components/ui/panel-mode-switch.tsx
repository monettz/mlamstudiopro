'use client';
import { useEffect, useState } from 'react';
import { Layers, Square } from 'lucide-react';

// Display mode for the admin and customer dashboards: "glass" (frosted,
// see-through panels over soft green light) or "solid" (opaque panels).
// Stored per browser; the layout applies it before first paint.
export type PanelMode = 'glass' | 'solid';
export const PANEL_MODE_KEY = 'mlam-panel-mode';

function storedMode(): PanelMode {
  try { return localStorage.getItem(PANEL_MODE_KEY) === 'solid' ? 'solid' : 'glass'; } catch { return 'glass'; }
}

export default function PanelModeSwitch({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<PanelMode>('glass');
  useEffect(() => { setMode(storedMode()); }, []);

  function choose(next: PanelMode) {
    setMode(next);
    document.documentElement.dataset.panelMode = next;
    try { localStorage.setItem(PANEL_MODE_KEY, next); } catch { /* private window: applies to this visit only */ }
  }

  return (
    <div className={`panel-mode-switch ${className}`} role="group" aria-label="Dashboard style">
      <button type="button" aria-pressed={mode === 'glass'} onClick={() => choose('glass')}>
        <Layers size={15} aria-hidden="true" /><span>Glass</span>
      </button>
      <button type="button" aria-pressed={mode === 'solid'} onClick={() => choose('solid')}>
        <Square size={15} aria-hidden="true" /><span>Solid</span>
      </button>
    </div>
  );
}
