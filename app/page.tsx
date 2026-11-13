import Storefront from "./storefront";
import { publicCatalog } from "@/lib/catalog";

export default async function Home() {
  // Render the store with real products on the server; if the database is
  // unreachable the storefront falls back to its built-in list and refetches.
  const catalog = await publicCatalog().catch(() => null);
  return <Storefront initialProducts={catalog?.products} initialDemos={catalog?.demos} />;
}
