import { revalidateTag, unstable_cache } from 'next/cache';
import { database, listProducts } from '@/lib/store';
import { builtInTranslations, productDescription, readDescriptionTranslations } from '@/lib/product-descriptions';

export type PublicDemo = { id: string; product_id: string; version: string; is_active: number; notes: string };

const CATALOG_TAG = 'catalog';

// Public storefront data (published / coming-soon products and active demos),
// shaped like the public /api/products and /api/demos responses. It is cached
// for a minute so visitors do not wait on the database every time; admin
// writes call refreshCatalog() so changes show up straight away.
export const publicCatalog = unstable_cache(async () => {
  const [products, demos] = await Promise.all([
    listProducts(true),
    database().prepare("SELECT d.id,d.product_id,d.version,d.is_active,d.notes FROM demo_releases d JOIN products p ON p.id=d.product_id WHERE d.is_active=1 AND p.status='published' ORDER BY d.created_at DESC").all<PublicDemo>(),
  ]);
  return {
    // Spread rows into plain objects: database rows may have a null prototype.
    products: products.map(product => ({
      ...product,
      description: productDescription(product, 'en').text,
      description_translations: JSON.stringify({ ...builtInTranslations(product), ...readDescriptionTranslations(product.description_translations) }),
    })),
    demos: (demos.results ?? []).map(demo => ({ ...demo })),
  };
}, ['public-catalog'], { revalidate: 60, tags: [CATALOG_TAG] });

export function refreshCatalog() {
  revalidateTag(CATALOG_TAG, { expire: 0 });
}
