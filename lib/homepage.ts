import { revalidateTag, unstable_cache } from 'next/cache';
import { database, ensureStore } from '@/lib/store';
import type { FeaturedVideo, HeroItem, PlaylistEntry } from '@/lib/homepage-media';

const HOMEPAGE_TAG = 'homepage';

export type HeroRow = { id: string; kind: 'image' | 'video'; r2_key: string; content_type: string; file_name: string; file_size: number; duration_ms: number; position: number; is_active: number; created_at: string };
export type PlaylistRow = { id: string; image: string; song: string; artist: string; producer: string; plugin: string; url: string; position: number; is_active: number; created_at: string };

export const heroFileUrl = (id: string) => `/api/hero-media/${id}/file`;

export async function readFeatured(): Promise<FeaturedVideo> {
  const rows = await database().prepare("SELECT key,value FROM settings WHERE key IN ('featured_video_id','featured_video_title')").all<{ key: string; value: string }>();
  const map = Object.fromEntries((rows.results ?? []).map(row => [row.key, row.value]));
  return { id: map.featured_video_id ?? '', title: map.featured_video_title ?? '' };
}

/** Everything the admin Homepage section shows, hidden items included. */
export async function adminHomepage() {
  await ensureStore();
  const [hero, playlist, featured] = await Promise.all([
    database().prepare('SELECT * FROM hero_media ORDER BY position, created_at').all<HeroRow>(),
    database().prepare('SELECT * FROM playlist_items ORDER BY position, created_at').all<PlaylistRow>(),
    readFeatured(),
  ]);
  return {
    hero: (hero.results ?? []).map(row => ({ ...row, src: heroFileUrl(row.id) })),
    playlist: (playlist.results ?? []).map(row => ({ ...row })),
    featured,
  };
}

// What visitors see, cached for a minute; admin changes call refreshHomepage().
export const publicHomepage = unstable_cache(async (): Promise<{ hero: HeroItem[]; featured: FeaturedVideo; playlist: PlaylistEntry[] }> => {
  await ensureStore();
  const [hero, playlist, featured] = await Promise.all([
    database().prepare('SELECT id,kind FROM hero_media WHERE is_active=1 ORDER BY position, created_at').all<{ id: string; kind: 'image' | 'video' }>(),
    database().prepare('SELECT image,song,artist,producer,plugin,url FROM playlist_items WHERE is_active=1 ORDER BY position, created_at').all<PlaylistEntry>(),
    readFeatured(),
  ]);
  return {
    hero: (hero.results ?? []).map(row => ({ id: row.id, kind: row.kind, src: heroFileUrl(row.id) })),
    featured,
    playlist: (playlist.results ?? []).map(row => ({ ...row })),
  };
}, ['public-homepage'], { revalidate: 60, tags: [HOMEPAGE_TAG] });

export function refreshHomepage() {
  revalidateTag(HOMEPAGE_TAG, { expire: 0 });
}

/** Next free position at the end of a list. */
export async function nextPosition(table: 'hero_media' | 'playlist_items') {
  const row = await database().prepare(`SELECT COALESCE(MAX(position),0) AS n FROM ${table}`).first<{ n: number }>();
  return Number(row?.n ?? 0) + 1;
}

/** Swaps an item with its neighbour above or below. */
export async function moveItem(table: 'hero_media' | 'playlist_items', id: string, direction: 'up' | 'down') {
  const rows = (await database().prepare(`SELECT id,position FROM ${table} ORDER BY position, created_at`).all<{ id: string; position: number }>()).results ?? [];
  const index = rows.findIndex(row => row.id === id);
  const other = rows[direction === 'up' ? index - 1 : index + 1];
  if (index < 0) return false;
  if (!other) return true;
  // Renumber everything so equal or missing positions cannot block a move.
  const order = rows.map(row => row.id);
  [order[index], order[order.indexOf(other.id)]] = [other.id, id];
  await database().batch(order.map((rowId, i) => database().prepare(`UPDATE ${table} SET position=? WHERE id=?`).bind(i + 1, rowId)));
  return true;
}
