// Rules and helpers for homepage content managed in Admin: the hero slideshow,
// the Featured Release video and the playlist wall. No imports, so the unit
// tests can load this file on its own.

export const MAX_HERO_ITEMS = 5;
export const MAX_HERO_VIDEO_MS = 6000;
// A small margin: encoders often round a 6-second clip up to 6.03 s.
export const HERO_VIDEO_TOLERANCE_MS = 150;
export const MAX_HERO_VIDEO_BYTES = 15 * 1024 * 1024;
export const MAX_HERO_IMAGE_BYTES = 8 * 1024 * 1024;
export const HERO_IMAGE_SECONDS = 6;
export const MAX_PLAYLIST_ITEMS = 24;

export type HeroItem = { id: string; kind: 'image' | 'video'; src: string };
export type FeaturedVideo = { id: string; title: string };
export type PlaylistEntry = { id?: string; image: string; song?: string; artist?: string; producer?: string; plugin?: string; url?: string };

function ascii(bytes: Uint8Array, at: number, length: number) {
  let text = '';
  for (let i = at; i < at + length && i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
  return text;
}
function uint(bytes: Uint8Array, at: number, length: number) {
  let value = 0;
  for (let i = 0; i < length; i++) value = value * 256 + bytes[at + i];
  return value;
}

/** MP4 length in milliseconds from the movie header ('mvhd'), or null. */
export function mp4DurationMs(bytes: Uint8Array): number | null {
  for (let i = 4; i + 32 <= bytes.length; i++) {
    if (bytes[i] !== 0x6d || ascii(bytes, i, 4) !== 'mvhd') continue;
    const version = bytes[i + 4];
    const body = i + 8; // after version (1) + flags (3)
    const timescale = version === 1 ? uint(bytes, body + 16, 4) : uint(bytes, body + 8, 4);
    const duration = version === 1 ? uint(bytes, body + 20, 8) : uint(bytes, body + 12, 4);
    if (!timescale || !duration || duration === 0xffffffff) return null;
    return Math.round((duration / timescale) * 1000);
  }
  return null;
}

// Reads an EBML variable-length size; returns [value, bytes used] or null.
function vint(bytes: Uint8Array, at: number): [number, number] | null {
  const first = bytes[at];
  if (first === undefined || first === 0) return null;
  let length = 1, mask = 0x80;
  while (!(first & mask)) { mask >>= 1; length++; }
  let value = first & (mask - 1);
  for (let i = 1; i < length; i++) value = value * 256 + bytes[at + i];
  return [value, length];
}

/** WebM length in milliseconds from Segment Info (Duration x TimecodeScale), or null. */
export function webmDurationMs(bytes: Uint8Array): number | null {
  let scale = 1_000_000; // nanoseconds per tick; the WebM default
  let duration: number | null = null;
  for (let i = 0; i + 3 < bytes.length; i++) {
    if (bytes[i] === 0x2a && bytes[i + 1] === 0xd7 && bytes[i + 2] === 0xb1) {
      const size = vint(bytes, i + 3);
      if (size && size[0] > 0 && size[0] <= 8) scale = uint(bytes, i + 3 + size[1], size[0]);
    }
    if (duration === null && bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
      const size = vint(bytes, i + 2);
      if (size && (size[0] === 4 || size[0] === 8)) {
        const view = new DataView(bytes.buffer, bytes.byteOffset + i + 2 + size[1], size[0]);
        duration = size[0] === 4 ? view.getFloat32(0) : view.getFloat64(0);
      }
    }
  }
  if (duration === null || !Number.isFinite(duration) || duration <= 0) return null;
  return Math.round((duration * scale) / 1_000_000);
}

export function videoDurationMs(bytes: Uint8Array, contentType: string): number | null {
  return contentType === 'video/webm' ? webmDurationMs(bytes) : mp4DurationMs(bytes);
}

export function heroVideoTooLong(durationMs: number) {
  return durationMs > MAX_HERO_VIDEO_MS + HERO_VIDEO_TOLERANCE_MS;
}

/** YouTube video id from an id or a youtube.com / youtu.be link; '' clears it; null is invalid. */
export function youtubeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text.startsWith('http') ? text : `https://${text}`);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    let id = '';
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'music.youtube.com') {
      id = url.searchParams.get('v') ?? '';
      if (!id) { const parts = url.pathname.split('/').filter(Boolean); if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1] ?? ''; }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** A playlist photo path (local) or HTTPS image; null when not allowed. */
export function playlistImage(value: unknown): string | null {
  const image = typeof value === 'string' ? value.trim() : '';
  if (!image || image.length > 2048 || image.startsWith('//')) return null;
  if (image.startsWith('/')) return image.split(/[?#]/)[0].split('/').includes('..') ? null : image;
  try { return new URL(image).protocol === 'https:' ? image : null; } catch { return null; }
}

/** Optional song link: empty, or an http(s) address. */
export function playlistLink(value: unknown): string | null {
  const link = text(value, 500);
  if (!link) return '';
  try { const url = new URL(link); return url.protocol === 'https:' || url.protocol === 'http:' ? link : null; } catch { return null; }
}

/** Cleans the caption fields of a playlist photo (all optional). */
export function playlistCaption(input: Record<string, unknown>) {
  return { song: text(input.song, 120), artist: text(input.artist, 120), producer: text(input.producer, 120), plugin: text(input.plugin, 120) };
}

export type FeaturedFields = { video_id?: string; video_title?: string; featured_text?: string; featured?: boolean };

/**
 * Featured Release fields sent with a product: its YouTube video, the video's
 * title, the short text under the Featured Release heading, and whether this is
 * the one featured product. Only fields that are present are returned.
 */
export function featuredFields(body: Record<string, unknown>): FeaturedFields | { error: string } {
  const out: FeaturedFields = {};
  if (Object.hasOwn(body, 'video')) {
    const id = youtubeId(body.video ?? '');
    if (id === null) return { error: 'Paste a YouTube video link, for example https://www.youtube.com/watch?v=…' };
    out.video_id = id;
  }
  if (Object.hasOwn(body, 'video_title')) out.video_title = text(body.video_title, 120);
  if (Object.hasOwn(body, 'featured_text')) out.featured_text = text(body.featured_text, 300);
  if (typeof body.featured === 'boolean') out.featured = body.featured;
  return out;
}
