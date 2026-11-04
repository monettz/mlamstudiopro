import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.MLAM_DATA_DIR = mkdtempSync(join(tmpdir(), 'mlam-r2-'));
const { signV4, r2Configuration, createR2Bucket } = await import('../lib/r2-bucket.mjs');

const ACCOUNT = '0123456789abcdef0123456789abcdef';
const full = { R2_ACCOUNT_ID: ACCOUNT, R2_ACCESS_KEY_ID: 'test-key', R2_SECRET_ACCESS_KEY: 'test-secret', R2_BUCKET: 'mlam-files' };

test('signs the published AWS Signature V4 GET example exactly', () => {
  // "GET Object" example from the Amazon S3 Signature Version 4 documentation.
  const authorization = signV4({
    method: 'GET', path: '/test.txt', region: 'us-east-1',
    headers: { host: 'examplebucket.s3.amazonaws.com', range: 'bytes=0-9', 'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'x-amz-date': '20130524T000000Z' },
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  });
  assert.equal(authorization, 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
});

test('R2 is off with no settings, on with all four, and refuses a partial setup', () => {
  assert.equal(r2Configuration({}), null);
  const config = r2Configuration(full);
  assert.equal(config.endpoint, `https://${ACCOUNT}.r2.cloudflarestorage.com`);
  assert.equal(config.bucket, 'mlam-files');
  assert.throws(() => r2Configuration({ R2_BUCKET: 'mlam-files' }), /partly configured/);
  assert.throws(() => r2Configuration({ ...full, R2_ACCOUNT_ID: 'not-an-account' }), /32-character/);
});

test('bucket uses path-style signed requests, ranges and 404s like the local bucket', async () => {
  const calls = [];
  const stored = new Map();
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const body = init.body ? Buffer.from(await new Response(init.body).arrayBuffer()) : null;
    calls.push({ url: String(url), method: init.method, headers: init.headers, body });
    const key = new URL(url).pathname.replace('/mlam-files/', '');
    if (init.method === 'PUT') { stored.set(key, { body, type: init.headers['content-type'] }); return new Response(null, { status: 200 }); }
    const object = stored.get(key);
    if (!object) return new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 });
    if (init.method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-length': String(object.body.length), 'content-type': object.type } });
    if (init.method === 'DELETE') { stored.delete(key); return new Response(null, { status: 204 }); }
    const range = init.headers.range?.match(/bytes=(\d+)-(\d+)/);
    const slice = range ? object.body.subarray(Number(range[1]), Number(range[2]) + 1) : object.body;
    return new Response(slice, { status: range ? 206 : 200 });
  };
  try {
    const bucket = createR2Bucket(r2Configuration(full));
    const stream = new Response('hello from MLAM').body;
    await bucket.put('tutorials/clip.mp4', stream, { httpMetadata: { contentType: 'video/mp4' } });

    const put = calls[0];
    assert.equal(put.url, `https://${ACCOUNT}.r2.cloudflarestorage.com/mlam-files/tutorials/clip.mp4`);
    assert.equal(put.headers['content-length'], '15');
    assert.equal(put.headers['x-amz-content-sha256'], 'UNSIGNED-PAYLOAD');
    assert.match(put.headers.authorization, /^AWS4-HMAC-SHA256 Credential=test-key\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=content-length;content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);

    const info = await bucket.head('tutorials/clip.mp4');
    assert.equal(info.size, 15);
    const headers = new Headers(); info.writeHttpMetadata(headers);
    assert.equal(headers.get('content-type'), 'video/mp4');

    const part = await bucket.get('tutorials/clip.mp4', { range: { offset: 6, length: 4 } });
    assert.equal(await new Response(part.body).text(), 'from');
    assert.equal(part.size, 15);

    assert.equal(await bucket.head('tutorials/missing.mp4'), null);
    assert.equal(await bucket.get('tutorials/missing.mp4'), null);
    await bucket.delete('tutorials/clip.mp4');
    assert.equal(await bucket.head('tutorials/clip.mp4'), null);
    await assert.rejects(bucket.put('../secrets.txt', new ArrayBuffer(1)), /Invalid storage key/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
