CREATE TABLE IF NOT EXISTS notify_requests (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(product_id, email));
CREATE INDEX IF NOT EXISTS notify_requests_created ON notify_requests(created_at);
