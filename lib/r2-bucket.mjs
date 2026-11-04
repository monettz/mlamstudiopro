import { createHash, createHmac, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { assertStorageKey, dataDirectory } from './node-runtime.mjs';

// Cloudflare R2 through its S3-compatible API, signed with AWS Signature V4.
// Implements the same put/head/get/delete contract as the local bucket.

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const REQUIRED = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];

/** Returns the R2 settings when all are present, null when none are, and throws when only some are. */
export function r2Configuration(source = process.env) {
  const present = REQUIRED.filter(name => typeof source[name] === 'string' && source[name].trim());
  if (!present.length) return null;
  if (present.length !== REQUIRED.length) {
    throw new Error(`Cloudflare R2 is partly configured. Set all of ${REQUIRED.join(', ')} or none of them.`);
  }
  const accountId = source.R2_ACCOUNT_ID.trim();
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new Error('R2_ACCOUNT_ID must be the 32-character Cloudflare account ID.');
  return {
    accountId,
    accessKeyId: source.R2_ACCESS_KEY_ID.trim(),
    secretAccessKey: source.R2_SECRET_ACCESS_KEY.trim(),
    bucket: source.R2_BUCKET.trim(),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

function hmac(key, value) { return createHmac('sha256', key).update(value, 'utf8').digest(); }
function sha256Hex(value) { return createHash('sha256').update(value, 'utf8').digest('hex'); }
// RFC 3986 encoding per path segment, as S3 expects; slashes between segments stay.
function encodePath(path) {
  return path.split('/').map(part => encodeURIComponent(part).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

/**
 * Builds the Authorization header for one request. `headers` must already hold
 * host, x-amz-date and x-amz-content-sha256; every header given is signed.
 */
export function signV4({ method, path, query = '', headers, payloadHash, accessKeyId, secretAccessKey, region = 'auto', service = 's3' }) {
  const amzDate = headers['x-amz-date'];
  const day = amzDate.slice(0, 8);
  const names = Object.keys(headers).map(name => name.toLowerCase()).sort();
  const lower = Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(value).trim().replace(/\s+/g, ' ')]));
  const canonicalHeaders = names.map(name => `${name}:${lower[name]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [method, encodePath(path), query, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${day}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), service), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function amzNow() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

async function send(config, method, key, { extraHeaders = {}, body, contentLength, payloadHash = EMPTY_SHA256 } = {}) {
  const path = `/${config.bucket}/${assertStorageKey(key)}`;
  const url = new URL(config.endpoint);
  const headers = { host: url.host, 'x-amz-date': amzNow(), 'x-amz-content-sha256': payloadHash, ...extraHeaders };
  if (contentLength !== undefined) headers['content-length'] = String(contentLength);
  const authorization = signV4({ method, path, headers, payloadHash, accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey });
  const requestHeaders = { ...headers, authorization };
  delete requestHeaders.host;
  return fetch(`${config.endpoint}${encodePath(path)}`, { method, headers: requestHeaders, body, ...(body ? { duplex: 'half' } : {}) });
}

function objectInfo(size, contentType) {
  return { size, writeHttpMetadata(headers) { headers.set('Content-Type', contentType || 'application/octet-stream'); } };
}

async function failure(response, action) {
  const detail = (await response.text().catch(() => '')).match(/<Code>([^<]+)<\/Code>/)?.[1];
  return new Error(`R2 ${action} failed (${response.status}${detail ? ` ${detail}` : ''})`);
}

export function createR2Bucket(config) {
  return {
    async put(key, input, options = {}) {
      assertStorageKey(key);
      const contentType = options.httpMetadata?.contentType || 'application/octet-stream';
      let body; let size; let spool;
      if (input instanceof ReadableStream) {
        // S3 needs a Content-Length, so large uploads are spooled to disk first
        // rather than held in memory.
        const dir = resolve(dataDirectory(), 'r2-spool');
        await mkdir(dir, { recursive: true, mode: 0o700 });
        spool = resolve(dir, `${randomUUID()}.tmp`);
        await pipeline(Readable.fromWeb(input), createWriteStream(spool, { flags: 'wx', mode: 0o600 }));
        size = (await stat(spool)).size;
        body = Readable.toWeb(createReadStream(spool));
      } else {
        body = new Uint8Array(input);
        size = body.byteLength;
      }
      try {
        const response = await send(config, 'PUT', key, { body, contentLength: size, payloadHash: 'UNSIGNED-PAYLOAD', extraHeaders: { 'content-type': contentType } });
        if (!response.ok) throw await failure(response, 'upload');
      } finally {
        if (spool) await unlink(spool).catch(() => {});
      }
    },
    async head(key) {
      const response = await send(config, 'HEAD', key);
      if (response.status === 404) return null;
      if (!response.ok) throw await failure(response, 'lookup');
      return objectInfo(Number(response.headers.get('content-length') ?? 0), response.headers.get('content-type'));
    },
    async get(key, options) {
      const info = await this.head(key);
      if (!info) return null;
      const range = options?.range;
      const extraHeaders = range ? { range: `bytes=${range.offset}-${range.offset + range.length - 1}` } : {};
      const response = await send(config, 'GET', key, { extraHeaders });
      if (response.status === 404) return null;
      if (!response.ok || !response.body) throw await failure(response, 'download');
      return { ...info, body: response.body };
    },
    async delete(key) {
      const response = await send(config, 'DELETE', key);
      if (!response.ok && response.status !== 404) throw await failure(response, 'delete');
    },
  };
}
