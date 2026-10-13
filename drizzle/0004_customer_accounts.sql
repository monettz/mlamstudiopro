CREATE TABLE customers (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, email_verified_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE customer_sessions (token_hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE INDEX customer_sessions_expiry ON customer_sessions(expires_at);
