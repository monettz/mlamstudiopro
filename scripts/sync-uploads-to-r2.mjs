// Copies files already stored in MLAM_DATA_DIR/uploads (ZIPs, demos, videos,
// product images) into Cloudflare R2, so switching storage does not lose them.
// Usage: npm run storage:sync-r2            (upload what R2 is missing)
//        npm run storage:sync-r2 -- --dry-run (only list what would be uploaded)
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';

for (const file of ['.env.local', '.env']) if (existsSync(file)) process.loadEnvFile(file);

const { dataDirectory } = await import('../lib/node-runtime.mjs');
const { createR2Bucket, r2Configuration } = await import('../lib/r2-bucket.mjs');

const config = r2Configuration();
if (!config) throw new Error('Cloudflare R2 is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET to .env.local first.');
const dryRun = process.argv.includes('--dry-run');
const bucket = createR2Bucket(config);
const root = resolve(dataDirectory(), 'uploads');

async function* files(dir) {
  if (!existsSync(dir)) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (!entry.name.endsWith('.metadata.json') && !entry.name.endsWith('.tmp')) yield path;
  }
}

let uploaded = 0; let skipped = 0;
for await (const path of files(root)) {
  const key = relative(root, path).split(sep).join('/');
  const { size } = await stat(path);
  const existing = await bucket.head(key);
  if (existing && existing.size === size) { skipped++; continue; }
  const metadata = existsSync(`${path}.metadata.json`) ? JSON.parse(await readFile(`${path}.metadata.json`, 'utf8')) : {};
  console.log(`${dryRun ? 'Would upload' : 'Uploading'} ${key} (${(size / 1048576).toFixed(1)} MB)`);
  if (!dryRun) await bucket.put(key, Readable.toWeb(createReadStream(path)), metadata);
  uploaded++;
}
console.log(`${dryRun ? 'Dry run: ' : ''}${uploaded} file(s) ${dryRun ? 'to upload' : 'uploaded'}, ${skipped} already in R2 bucket "${config.bucket}".`);
