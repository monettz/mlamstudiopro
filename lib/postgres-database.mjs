// PostgreSQL (Supabase) adapter with the same prepare/bind/first/all/run and
// batch interface as the SQLite one in node-runtime.mjs. Queries are written
// once with SQLite-style `?` placeholders and translated here.
import postgres from 'postgres';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const translated = new Map();
/** `?` → `$1..$n` (outside string literals); INSERT OR IGNORE → ON CONFLICT DO NOTHING. */
export function toPostgres(sql) {
  let text = translated.get(sql);
  if (text) return text;
  let index = 0; let quoted = false; text = '';
  for (const ch of sql) {
    if (ch === "'") quoted = !quoted;
    text += ch === '?' && !quoted ? `$${++index}` : ch;
  }
  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO/i.test(text)) {
    text = text.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO').replace(/;\s*$/, '');
    const returning = text.search(/\sRETURNING\s/i);
    text = returning < 0 ? `${text} ON CONFLICT DO NOTHING` : `${text.slice(0, returning)} ON CONFLICT DO NOTHING${text.slice(returning)}`;
  }
  translated.set(sql, text);
  return text;
}

const value = item => item === undefined ? null : typeof item === 'boolean' ? (item ? 1 : 0) : item;

class Statement {
  constructor(client, text, values = []) { this.client = client; this.text = text; this.values = values; }
  bind(...values) { return new Statement(this.client, this.text, values.map(value)); }
  execute(client = this.client) { return client.unsafe(this.text, this.values); }
  async first() { return (await this.execute())[0] ?? null; }
  async all() { return { results: [...await this.execute()] }; }
  async run() { return { meta: { changes: (await this.execute()).count } }; }
}

/** Accepts only a postgres:// or postgresql:// connection string; empty means "not configured". */
export function postgresUrl(env = process.env) {
  const url = env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error('DATABASE_URL must be a postgresql:// connection string (Supabase: Connect -> Session pooler).');
  return url;
}

export function createPostgresDatabase(url) {
  const sql = postgres(url, {
    ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : 'require',
    prepare: false, // required by the Supabase pooler in transaction mode
    max: Number(process.env.DATABASE_POOL_SIZE) || 5,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
    // COUNT(*) and BIGINT columns come back as numbers, as they do from SQLite.
    types: { bigint: { to: 20, from: [20], serialize: x => String(x), parse: x => Number(x) } },
  });
  return {
    sql,
    prepare: text => new Statement(sql, toPostgres(text)),
    async batch(statements) {
      return sql.begin(async tx => {
        const results = [];
        for (const statement of statements) results.push({ meta: { changes: (await statement.execute(tx)).count } });
        return results;
      });
    },
    end: () => sql.end({ timeout: 5 }),
  };
}

/** Applies migrations/postgres/*.sql once each, one instance at a time. */
export async function migratePostgres(db, directory = resolve('migrations/postgres')) {
  if (!existsSync(directory)) return;
  await db.sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(4180118)`;
    await tx`CREATE TABLE IF NOT EXISTS _mlam_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`;
    const done = new Set((await tx`SELECT name FROM _mlam_migrations`).map(row => row.name));
    for (const name of readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      if (done.has(name)) continue;
      await tx.unsafe(readFileSync(resolve(directory, name), 'utf8'));
      await tx`INSERT INTO _mlam_migrations VALUES (${name}, ${new Date().toISOString()})`;
    }
  });
}
