CREATE TABLE admin_accounts (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE admin_sessions (token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE auth_throttle (key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, reset_at INTEGER NOT NULL);
