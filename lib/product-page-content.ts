// "How it works" steps and the Specs list shown on a product page. Stored as
// JSON text in products.page_steps / products.page_specs and edited in Admin.
export type PageStep = { title: string; text: string };
export type PageSpec = { label: string; value: string };

export const MAX_STEPS = 6;
export const MAX_SPECS = 10;

// Shown while a plugin has no specs of its own (the previous fixed list).
export const DEFAULT_SPECS: PageSpec[] = [
  { label: 'Format', value: 'VST3 (64-bit)' },
  { label: 'Platform', value: 'Windows' },
  { label: 'Works in', value: 'FL Studio, Ableton Live, Cubase, Studio One, Reaper, Bitwig' },
  { label: 'License', value: 'One-time purchase, lifetime license' },
  { label: 'Delivery', value: 'Download with your license key' },
];

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function parse(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

/** Steps from the database or a request; blank rows are dropped. */
export function readSteps(value: unknown): PageStep[] {
  return parse(value)
    .map(item => (item && typeof item === 'object' ? { title: clean((item as PageStep).title, 60), text: clean((item as PageStep).text, 240) } : null))
    .filter((item): item is PageStep => !!item && !!item.title)
    .slice(0, MAX_STEPS);
}

/** Spec rows from the database or a request; rows need both a label and a value. */
export function readSpecs(value: unknown): PageSpec[] {
  return parse(value)
    .map(item => (item && typeof item === 'object' ? { label: clean((item as PageSpec).label, 40), value: clean((item as PageSpec).value, 200) } : null))
    .filter((item): item is PageSpec => !!item && !!item.label && !!item.value)
    .slice(0, MAX_SPECS);
}

/** Request validation: null when the input is not a list or has too many rows. */
export function validSteps(value: unknown): PageStep[] | null {
  return Array.isArray(value) && value.length <= MAX_STEPS ? readSteps(value) : null;
}
export function validSpecs(value: unknown): PageSpec[] | null {
  return Array.isArray(value) && value.length <= MAX_SPECS ? readSpecs(value) : null;
}
