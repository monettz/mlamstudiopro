// The store's database: Supabase / PostgreSQL when DATABASE_URL is set,
// otherwise the SQLite file in MLAM_DATA_DIR. Both share one interface.
import { localDatabase, migrate as migrateSqlite } from './node-runtime.mjs';
import { createPostgresDatabase, migratePostgres, postgresUrl } from './postgres-database.mjs';

// Kept on globalThis so dev-server reloads reuse one connection pool.
const pools = globalThis.__mlamPostgres ??= new Map();
function backend() {
  const url = postgresUrl();
  if (!url) return localDatabase;
  if (!pools.has(url)) pools.set(url, createPostgresDatabase(url));
  return pools.get(url);
}

export const databaseBackend = () => (postgresUrl() ? 'postgres' : 'sqlite');
export const db = {
  prepare: sql => backend().prepare(sql),
  batch: statements => backend().batch(statements),
};
export async function migrateDatabase() {
  const current = backend();
  if (current === localDatabase) migrateSqlite();
  else await migratePostgres(current);
}
export async function closeDatabase() {
  for (const pool of pools.values()) await pool.end();
  pools.clear();
}
