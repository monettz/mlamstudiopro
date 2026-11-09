export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { migrateDatabase } = await import('./lib/database.mjs');
    await migrateDatabase();
    if (process.env.NODE_ENV === 'production') {
      // Hosts without a persistent disk (e.g. Render's free plan) wipe local
      // files on every restart, so say loudly where data is being kept.
      const r2 = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'].every(key => process.env[key]);
      if (!process.env.DATABASE_URL) console.warn('[mlam] DATABASE_URL is not set: the store database is a local SQLite file. Without a persistent disk it is lost on restart.');
      if (!r2) console.warn('[mlam] R2 is not configured: uploaded files are kept on local disk. Without a persistent disk they are lost on restart.');
    }
  }
}
