import { localDatabase, bucket as localBucket, type LocalBucket } from './node-runtime.mjs';
import { createR2Bucket, r2Configuration } from './r2-bucket.mjs';

// Files go to Cloudflare R2 when all R2_* variables are set, otherwise to
// MLAM_DATA_DIR/uploads on this server. The choice is made per call so a
// restart with new environment variables is all a switch needs.
let r2: { key: string; bucket: LocalBucket } | null = null;
function storage(): LocalBucket {
  const config = r2Configuration();
  if (!config) return localBucket;
  const key = `${config.accountId}/${config.bucket}/${config.accessKeyId}`;
  if (r2?.key !== key) r2 = { key, bucket: createR2Bucket(config) };
  return r2.bucket;
}

const releases: LocalBucket = {
  put: (...args) => storage().put(...args),
  head: (...args) => storage().head(...args),
  get: (...args) => storage().get(...args),
  delete: (...args) => storage().delete(...args),
};

// Server-only adapters; no platform-issued headers or remote Sites resources.
export const env = { DB: localDatabase, RELEASES: releases };
export const storageBackend = () => (r2Configuration() ? 'r2' : 'local');
