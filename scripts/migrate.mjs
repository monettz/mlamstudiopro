import { existsSync } from 'node:fs';
// Same settings the website uses: DATABASE_URL in .env.local selects Supabase.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const { migrateDatabase, closeDatabase, databaseBackend } = await import('../lib/database.mjs');
await migrateDatabase();
await closeDatabase();
console.log(`MLAM Studio Pro database migrations applied (${databaseBackend() === 'postgres' ? 'Supabase / PostgreSQL' : 'local SQLite'}).`);
