import { database } from '@/lib/store';
import type { FeaturedFields } from '@/lib/homepage-media';

/** The one product shown in the homepage Featured Release ('' = none chosen). */
export async function featuredProductId() {
  const row = await database().prepare("SELECT value FROM settings WHERE key='featured_product_id'").first<{ value: string }>();
  return row?.value ?? '';
}

/** Saves a product's video and featured text, and makes it (or stops it being) the featured product. */
export async function saveFeaturedFields(productId: string, fields: FeaturedFields) {
  const statements = [];
  for (const column of ['video_id', 'video_title', 'featured_text'] as const) {
    if (fields[column] !== undefined) statements.push(database().prepare(`UPDATE products SET ${column}=? WHERE id=?`).bind(fields[column], productId));
  }
  const setting = (value: string) => database().prepare("INSERT INTO settings(key,value) VALUES('featured_product_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(value);
  // Only one product can be featured: choosing this one replaces the previous one.
  if (fields.featured === true) statements.push(setting(productId));
  else if (fields.featured === false && await featuredProductId() === productId) statements.push(setting(''));
  if (statements.length) await database().batch(statements);
}
