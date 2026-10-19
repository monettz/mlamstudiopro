import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { mkdir, rename, unlink, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const dataDirectory = () => {
  if (process.env.MLAM_DATA_DIR) return resolve(process.env.MLAM_DATA_DIR);
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return resolve('/tmp/mlam-data');
  return resolve('./data');
};
let connection;
class Statement {
  constructor(sql, values = []) { this.sql = sql; this.values = values; }
  bind(...values) { return new Statement(this.sql, values); }
  native() { return rawDatabase().prepare(this.sql); }
  async first() { return this.native().get(...this.values) ?? null; }
  async all() { return { results: this.native().all(...this.values) }; }
  async run() { const result = this.native().run(...this.values); return { meta: { changes: Number(result.changes) } }; }
}
export function rawDatabase() {
  if (!connection) {
    const dir = dataDirectory();
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const targetDb = resolve(dir, 'mlam.sqlite');
    if (dir !== resolve('./data') && !existsSync(targetDb) && existsSync(resolve('./data/mlam.sqlite'))) {
      try {
        mkdirSync(resolve(dir, 'uploads'), { recursive: true, mode: 0o700 });
        copyFileSync(resolve('./data/mlam.sqlite'), targetDb);
      } catch {
        // Fallback gracefully if read-only source
      }
    }
    connection = new DatabaseSync(targetDb);
    connection.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  }
  return connection;
}
export const localDatabase = {
  prepare: sql => new Statement(sql),
  async batch(statements) {
    const db = rawDatabase(); db.exec('BEGIN IMMEDIATE');
    try { const results = []; for (const s of statements) results.push(await s.run()); db.exec('COMMIT'); return results; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
};
export function migrate() {
  const db = rawDatabase();
  db.exec('CREATE TABLE IF NOT EXISTS _mlam_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const directory = resolve('drizzle');
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
    if (db.prepare('SELECT name FROM _mlam_migrations WHERE name=?').get(name)) continue;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync(resolve(directory, name), 'utf8'));
      db.prepare('INSERT INTO _mlam_migrations VALUES (?,?)').run(name, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
}
function filePath(key) {
  if (!/^(releases|demos|tutorials|product-images)\/[a-zA-Z0-9._\/-]+$/.test(key) || key.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid storage key');
  const root = resolve(dataDirectory(), 'uploads'); const path = resolve(root, key);
  if (!path.startsWith(root + sep)) throw new Error('Storage path escaped its root');
  return path;
}
function metadata(size, stored) {
  return { size, writeHttpMetadata(headers) { headers.set('Content-Type', stored.httpMetadata?.contentType || 'application/octet-stream'); } };
}
export const bucket = {
  async put(key, input, options = {}) {
    const path = filePath(key); await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const temp = `${path}.${randomUUID()}.tmp`;
    try {
      if (input instanceof ReadableStream) await pipeline(Readable.fromWeb(input), createWriteStream(temp, { flags: 'wx', mode: 0o600 }));
      else await writeFile(temp, new Uint8Array(input), { flag: 'wx', mode: 0o600 });
      await rename(temp, path);
      await writeFile(`${path}.metadata.json`, JSON.stringify(options), { mode: 0o600 });
    } catch (error) { await unlink(temp).catch(() => {}); await unlink(path).catch(() => {}); throw error; }
  },
  async head(key) {
    const path = filePath(key);
    try { const info = await stat(path); return metadata(info.size, JSON.parse(await readFile(`${path}.metadata.json`, 'utf8'))); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  },
  async get(key, options) {
    const info = await this.head(key); if (!info) return null;
    const range = options?.range;
    const stream = createReadStream(filePath(key), range ? { start: range.offset, end: range.offset + range.length - 1 } : undefined);
    return { ...info, body: Readable.toWeb(stream) };
  },
  async delete(key) {
    const path = filePath(key);
    await unlink(path).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await unlink(`${path}.metadata.json`).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
};
