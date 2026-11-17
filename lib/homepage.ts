import { revalidateTag, unstable_cache } from 'next/cache';
import { database, ensureStore } from '@/lib/store';
import type { HeroItem, PlaylistEntry } from '@/lib/homepage-media';
import { featuredProductId } from '@/lib/featured-product';

const HOMEPAGE_TAG = 'homepage';

export type HeroRow = { id: string; kind: 'image' | 'video'; r2_key: string; content_type: string; file_name: string; file_size: number; duration_ms: number; position: number; is_active: number; created_at: string };
export type PlaylistRow = { id: string; image: string; song: string; artist: string; producer: string; plugin: string; url: string; position: number; is_active: number; created_at: string };

export const heroFileUrl = (id: string) => `/api/hero-media/${id}/file`;

/** Everything the admin Homepage section shows, hidden items included. */
export async function adminHomepage() {
  await ensureStore();
  const [hero, playlist, featuredId] = await Promise.all([
    database().prepare('SELECT * FROM hero_media ORDER BY position, created_at').all<HeroRow>(),
    database().prepare('SELECT * FROM playlist_items ORDER BY position, created_at').all<PlaylistRow>(),
    featuredProductId(),
  ]);
  const featured = featuredId ? await database().prepare('SELECT id,name,image,status,video_id,featured_text FROM products WHERE id=?').bind(featuredId).first<{ id: string; name: string; image: string; status: string; video_id: string; featured_text: string }>() : null;
  return {
    hero: (hero.results ?? []).map(row => ({ ...row, src: heroFileUrl(row.id) })),
    playlist: (playlist.results ?? []).map(row => ({ ...row })),
    featured: featured ? { ...featured } : null,
  };
}

// What visitors see, cached for a minute; admin changes call refreshHomepage().
export const publicHomepage = unstable_cache(async (): Promise<{ hero: HeroItem[]; featuredProductId: string; playlist: PlaylistEntry[] }> => {
  await ensureStore();
  const [hero, playlist, featuredId] = await Promise.all([
    database().prepare('SELECT id,kind FROM hero_media WHERE is_active=1 ORDER BY position, created_at').all<{ id: string; kind: 'image' | 'video' }>(),
    database().prepare('SELECT image,song,artist,producer,plugin,url FROM playlist_items WHERE is_active=1 ORDER BY position, created_at').all<PlaylistEntry>(),
    featuredProductId(),
  ]);
  return {
    hero: (hero.results ?? []).map(row => ({ id: row.id, kind: row.kind, src: heroFileUrl(row.id) })),
    featuredProductId: featuredId,
    playlist: (playlist.results ?? []).map(row => ({ ...row })),
  };
}, /* bump the key when the cached shape changes, so a deploy never reads old entries */ ['public-homepage-v2'], { revalidate: 60, tags: [HOMEPAGE_TAG] });

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
