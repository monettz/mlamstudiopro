ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE orders ADD COLUMN customer_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN license_id TEXT;
CREATE INDEX IF NOT EXISTS orders_provider_ref ON orders(provider_ref);
