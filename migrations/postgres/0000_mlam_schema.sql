-- MLAM Studio Pro schema for Supabase / PostgreSQL. Mirrors drizzle/0000-0010
-- (the SQLite schema) so the same queries run on both databases.
-- Millisecond timestamps, file sizes and money use BIGINT; the app reads
-- them back as plain numbers.
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  image TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  checkout_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  description_translations TEXT NOT NULL DEFAULT '{}',
  gallery_images TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  version TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  customer_phone TEXT NOT NULL DEFAULT '',
  license_id TEXT
);
CREATE INDEX IF NOT EXISTS orders_provider_ref ON orders(provider_ref);
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 5,
  expires_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS demo_releases (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  version TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_throttle (key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, reset_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, email_verified_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS customer_sessions (token_hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS customer_sessions_expiry ON customer_sessions(expires_at);
CREATE TABLE IF NOT EXISTS notify_requests (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(product_id, email));
CREATE INDEX IF NOT EXISTS notify_requests_created ON notify_requests(created_at);

-- Supabase publishes the public schema through its REST API with the
-- publishable key. Only this server (connecting as the database owner) may
-- touch these tables: row level security with no policies blocks the REST
-- API, and the API roles lose their grants.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','releases','orders','licenses','settings','tutorials','demo_releases','admin_accounts','admin_sessions','auth_throttle','customers','customer_sessions','notify_requests'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN EXECUTE format('REVOKE ALL ON %I FROM anon', t); END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN EXECUTE format('REVOKE ALL ON %I FROM authenticated', t); END IF;
  END LOOP;
END $$;
