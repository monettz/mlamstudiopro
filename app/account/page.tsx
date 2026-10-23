import { redirect } from 'next/navigation';
import { customerUser } from '@/lib/customer';
import { database, ensureStore } from '@/lib/store';
import AccountPanel from './panel';

export const dynamic = 'force-dynamic';

export type CustomerLicenseItem = {
  id: string;
  product_id: string;
  customer_email: string;
  license_key: string;
  status: string;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
  created_at: string;
  product_name: string | null;
  product_slug: string | null;
  product_category: string | null;
  product_image: string | null;
  release_version: string | null;
  release_file_name: string | null;
  release_file_size: number | null;
};

export type CustomerOrderItem = {
  id: string;
  product_id: string;
  customer_email: string;
  amount_cents: number;
  status: string;
  provider_ref: string;
  created_at: string;
  product_name: string | null;
  product_image: string | null;
};

export default async function AccountPage() {
  const user = await customerUser();
  if (!user) redirect('/account/login');

  await ensureStore();
  const db = database();
  const normalizedEmail = user.email.toLowerCase().trim();

  let licenses: CustomerLicenseItem[] = [];
  let orders: CustomerOrderItem[] = [];

  try {
    const licensesResult = await db.prepare(`
      SELECT 
        l.id, 
        l.product_id, 
        l.customer_email, 
        l.license_key, 
        l.status, 
        l.download_count, 
        l.max_downloads, 
        l.expires_at, 
        l.created_at,
        p.name AS product_name,
        p.slug AS product_slug,
        p.category AS product_category,
        p.image AS product_image,
        (SELECT version FROM releases WHERE product_id = l.product_id AND is_active = 1 ORDER BY created_at DESC LIMIT 1) AS release_version,
        (SELECT file_name FROM releases WHERE product_id = l.product_id AND is_active = 1 ORDER BY created_at DESC LIMIT 1) AS release_file_name,
        (SELECT file_size FROM releases WHERE product_id = l.product_id AND is_active = 1 ORDER BY created_at DESC LIMIT 1) AS release_file_size
      FROM licenses l
      LEFT JOIN products p ON l.product_id = p.id
      WHERE LOWER(l.customer_email) = ?
      ORDER BY l.created_at DESC
    `).bind(normalizedEmail).all<CustomerLicenseItem>();

    licenses = (licensesResult?.results ?? []) as CustomerLicenseItem[];
  } catch (err) {
    console.error('Failed to load customer licenses:', err);
  }

  try {
    const ordersResult = await db.prepare(`
      SELECT 
        o.id,
        o.product_id,
        o.customer_email,
        o.amount_cents,
        o.status,
        o.provider_ref,
        o.created_at,
        p.name AS product_name,
        p.image AS product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE LOWER(o.customer_email) = ?
      ORDER BY o.created_at DESC
    `).bind(normalizedEmail).all<CustomerOrderItem>();

    orders = (ordersResult?.results ?? []) as CustomerOrderItem[];
  } catch (err) {
    console.error('Failed to load customer orders:', err);
  }

  return (
    <AccountPanel
      name={user.full_name}
      email={user.email}
      verified={!!user.email_verified_at}
      licenses={licenses}
      orders={orders}
    />
  );
}
