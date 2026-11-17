import Storefront from "./storefront";
import { publicCatalog } from "@/lib/catalog";
import { publicHomepage } from "@/lib/homepage";

export default async function Home() {
  // Render the store with real products and the homepage content set in Admin
  // on the server; if the database is unreachable the storefront falls back to
  // its built-in list and defaults.
  const [catalog, homepage] = await Promise.all([publicCatalog().catch(() => null), publicHomepage().catch(() => null)]);
  return <Storefront initialProducts={catalog?.products} initialDemos={catalog?.demos} homepage={homepage} />;
}
