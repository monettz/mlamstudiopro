// Copies the store's records from the local SQLite file (MLAM_DATA_DIR, default
// ./data) into the Supabase database named by DATABASE_URL in .env.local.
// Rows that already exist in Supabase are left as they are, so running it
// twice is safe. Sign-in sessions and rate-limit counters are not copied.
// Usage: npm run db:copy-to-supabase
import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const { rawDatabase, migrate } = await import('../lib/node-runtime.mjs');
const { createPostgresDatabase, migratePostgres, postgresUrl } = await import('../lib/postgres-database.mjs');

const url = postgresUrl();
if (!url) throw new Error('Set DATABASE_URL in .env.local first (Supabase: Connect -> Session pooler).');
// Parents before children so the foreign keys are satisfied.
const tables = ['products', 'releases', 'demo_releases', 'tutorials', 'licenses', 'orders', 'settings', 'notify_requests', 'admin_accounts', 'customers'];

migrate();
const sqlite = rawDatabase();
const target = createPostgresDatabase(url);
try {
  await migratePostgres(target);
  for (const table of tables) {
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    let copied = 0;
    for (const row of rows) {
      const columns = Object.keys(row);
      const result = await target.prepare(`INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`)
        .bind(...columns.map(column => row[column])).run();
      copied += result.meta.changes;
    }
    console.log(`${table}: ${copied} copied, ${rows.length - copied} already there`);
  }
} finally { await target.end(); }
