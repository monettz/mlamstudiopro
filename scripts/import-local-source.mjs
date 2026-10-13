// One-time, non-destructive import into the independent, local-only website.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const target = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const parent = resolve(target, '..');
if (existsSync(resolve(target, 'app'))) throw new Error('Import already completed; refusing to overwrite source.');
for (const dir of ['app', 'lib', 'public', 'drizzle']) cpSync(resolve(parent, 'MLAM_PLUGIN_SITE', dir), resolve(target, dir), { recursive: true, errorOnExist: true });
cpSync(resolve(parent, 'MLAM_DAW_SITE/dist/mlam-mark-3d-green.png'), resolve(target, 'public/mlam-mark-3d-green.png'));
// Mechanical conversion only. Business logic will be reviewed separately.
function visit(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (item.isDirectory()) visit(path);
    else if (/\.tsx?$/.test(item.name)) {
      const original = readFileSync(path, 'utf8');
      const updated = original.replace(/import \{ env \} from "cloudflare:workers";/g, 'import { env } from "@/lib/runtime";')
        .replace(/D1Database/g, 'LocalDatabase').replace(/R2Bucket/g, 'LocalBucket')
        .replace(/\bPLUGINS<small>/g, 'STUDIO PRO<small>').replace(/\bPLUGINS<\/span>/g, 'STUDIO PRO</span>');
      if (original !== updated) writeFileSync(path, updated);
    }
  }
}
visit(resolve(target, 'app')); visit(resolve(target, 'lib'));
mkdirSync(resolve(target, 'tests'), { recursive: true });
for (const file of ['product-image.ts', 'tutorial-media.ts']) if (!existsSync(resolve(target, 'lib', file))) throw new Error('Missing media validation');
console.log('Imported local sources and artwork. Hosted project identities, credentials, databases and ZIPs were not copied.');
