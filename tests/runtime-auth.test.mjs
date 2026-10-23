import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const folder = mkdtempSync(resolve(tmpdir(), 'mlam-unified-test-'));
process.env.MLAM_DATA_DIR = folder;
const runtime = await import('../lib/node-runtime.mjs');
const auth = await import('../lib/auth-core.mjs');
const { takeQuota, resetQuota, quotaKey, clientAddress, INVALID_CREDENTIALS } = await import('../lib/rate-limit.mjs');
const { trustedOrigin } = await import('../lib/request-origin.mjs');
runtime.migrate();
after(() => { runtime.rawDatabase().close(); rmSync(folder, { recursive: true, force: true }); });

test('all store and admin tables migrate once, preserving existing rows', async () => {
  const db = runtime.rawDatabase();
  for (const table of ['products','releases','orders','licenses','tutorials','demo_releases','admin_accounts','admin_sessions']) assert.ok(db.prepare('SELECT name FROM sqlite_master WHERE name=?').get(table));
  db.prepare('INSERT INTO settings VALUES (?,?)').run('test','preserved'); runtime.migrate();
  assert.equal(db.prepare('SELECT value FROM settings WHERE key=?').get('test').value, 'preserved');
});
test('batch operations roll back on failure', async () => {
  const db = runtime.localDatabase;
  await assert.rejects(db.batch([db.prepare('INSERT INTO settings VALUES (?,?)').bind('rollback','yes'),db.prepare('INSERT INTO missing_table VALUES (?)').bind('bad')]));
  assert.equal(await db.prepare('SELECT value FROM settings WHERE key=?').bind('rollback').first(), null);
});
test('description language migration preserves original copy, artwork, price and status across restart',()=>{
  const db=runtime.rawDatabase();assert.ok(db.prepare('PRAGMA table_info(products)').all().some(column=>column.name==='description_translations'));
  db.prepare('INSERT INTO products (id,slug,name,category,description,price_cents,status,image,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run('migration-copy-test','migration-copy-test','Owner product','Plugin','Original owner text',7300,'draft','/owner-image.png','test','test');
  const before=db.prepare('SELECT * FROM products WHERE id=?').get('migration-copy-test');assert.equal(before.description_translations,'{}');runtime.migrate();
  assert.deepEqual(db.prepare('SELECT * FROM products WHERE id=?').get('migration-copy-test'),before);
});
test('media is outside the public directory, streams byte ranges and blocks traversal', async () => {
  await runtime.bucket.put('tutorials/example.mp4', new Uint8Array([1,2,3,4,5]).buffer, { httpMetadata: { contentType: 'video/mp4' } });
  assert.equal((await runtime.bucket.head('tutorials/example.mp4')).size,5);
  const object = await runtime.bucket.get('tutorials/example.mp4', {range:{offset:1,length:2}});
  assert.deepEqual([...new Uint8Array(await new Response(object.body).arrayBuffer())],[2,3]);
  const headers = new Headers(); object.writeHttpMetadata(headers); assert.equal(headers.get('content-type'),'video/mp4');
  await assert.rejects(runtime.bucket.get('releases/../../private'));
  await assert.rejects(runtime.bucket.get('../mlam.sqlite'));
  await runtime.bucket.delete('tutorials/example.mp4'); assert.equal(await runtime.bucket.get('tutorials/example.mp4'),null);
});
test('no administrator or default password grants access before private setup', async () => {
  assert.equal(auth.configuredAdmin(),null);
  assert.equal((await auth.loginAdmin('owner@example.test','not-a-real-password')).status,503);
  assert.equal(auth.sessionUser(''),null);
});
test('hashed password login creates a revocable, expiring server-side session', async () => {
  const password = randomBytes(32).toString('hex'); const hash = auth.passwordHash(password);
  assert.notEqual(hash,password); assert.equal(await auth.verifyPassword('wrong',hash),false);
  runtime.rawDatabase().prepare('INSERT INTO admin_accounts VALUES (?,?,?,?)').run('admin','owner@example.test',hash,new Date().toISOString());
  const denied = await auth.loginAdmin('owner@example.test','wrong');
  assert.equal(denied.status,401); assert.equal(denied.error, INVALID_CREDENTIALS);
  assert.equal((await auth.loginAdmin('wrong@example.test',password)).status,401);
  const result = await auth.loginAdmin('OWNER@example.test',password); assert.equal(result.status,200); assert.equal(auth.sessionUser(result.token).email,'owner@example.test');
  const stored = runtime.rawDatabase().prepare('SELECT token_hash FROM admin_sessions').get(); assert.notEqual(stored.token_hash,result.token);
  auth.revokeSession(result.token); assert.equal(auth.sessionUser(result.token),null);
  const next = await auth.loginAdmin('owner@example.test',password); runtime.rawDatabase().prepare('UPDATE admin_sessions SET expires_at=0').run(); assert.equal(auth.sessionUser(next.token),null);
});
test('repeated bad administrator attempts are throttled persistently', async () => {
  resetQuota('admin-login-account', 'admin');
  for (let i = 0; i < 5; i++) assert.equal((await auth.loginAdmin('owner@example.test',null)).status,401);
  const denied = await auth.loginAdmin('owner@example.test','wrong'); assert.equal(denied.status,429); assert.ok(denied.retryAfter > 0 && denied.retryAfter <= 900);
  const before = runtime.rawDatabase().prepare('SELECT failures,reset_at FROM auth_throttle WHERE key=?').get(quotaKey('admin-login-account','admin'));
  await auth.loginAdmin('owner@example.test','wrong');
  assert.deepEqual(runtime.rawDatabase().prepare('SELECT failures,reset_at FROM auth_throttle WHERE key=?').get(quotaKey('admin-login-account','admin')), before);
});
test('per-user database quotas are isolated, bounded and reset after cooldown', () => {
  const now = 1700000000000; const subject = "user@example.test' OR 1=1 --";
  assert.equal(takeQuota('test-user',subject,2,1000,now).allowed,true);
  assert.equal(takeQuota('test-user',subject,2,1000,now+1).allowed,true);
  assert.deepEqual(takeQuota('test-user',subject,2,1000,now+2),{allowed:false,retryAfter:1});
  assert.equal(takeQuota('test-user','different-user',2,1000,now+2).allowed,true);
  assert.equal(takeQuota('different-action',subject,2,1000,now+2).allowed,true);
  assert.equal(takeQuota('test-user',subject,2,1000,now+1000).allowed,true);
  assert.ok(!quotaKey('test-user',subject).includes('user@example.test'));
});
test('only explicitly trusted, single reverse-proxy IP headers identify callers', () => {
  const prior=process.env.MLAM_TRUST_PROXY_IP; delete process.env.MLAM_TRUST_PROXY_IP;
  const fake=new Request('https://mlam.example',{headers:{'x-forwarded-for':'203.0.113.1','x-mlam-client-ip':'203.0.113.2'}});
  assert.equal(clientAddress(fake),'untrusted-shared'); process.env.MLAM_TRUST_PROXY_IP='1';
  assert.equal(clientAddress(fake),'203.0.113.2');
  assert.equal(clientAddress(new Request('https://mlam.example',{headers:{'x-mlam-client-ip':'203.0.113.2, 203.0.113.3'}})),'untrusted-shared');
  assert.equal(clientAddress(new Request('https://mlam.example',{headers:{'x-forwarded-for':'203.0.113.1'}})),'untrusted-shared');
  if(prior===undefined)delete process.env.MLAM_TRUST_PROXY_IP;else process.env.MLAM_TRUST_PROXY_IP=prior;
});
test('a separate fresh process cannot bypass an existing database cooldown', () => {
  assert.equal(takeQuota('restart-test','test-user',1,60000).allowed,true);
  const moduleURL = new URL('../lib/rate-limit.mjs',import.meta.url).href;
  const child = spawnSync(process.execPath,['--input-type=module','-e',`import { takeQuota } from ${JSON.stringify(moduleURL)}; process.stdout.write(JSON.stringify(takeQuota('restart-test','test-user',1,60000)));`], {env:{...process.env,MLAM_DATA_DIR:folder},encoding:'utf8',windowsHide:true});
  assert.equal(child.status,0,child.stderr);
  const result=JSON.parse(child.stdout); assert.equal(result.allowed,false); assert.ok(result.retryAfter>0);
});
test('cross-site, missing-Origin and spoofed browser mutations are blocked', () => {
  const old = process.env.MLAM_ORIGIN; process.env.MLAM_ORIGIN = 'https://mlam.example';
  assert.equal(trustedOrigin(new Request('http://127.0.0.1:4180/api/products',{headers:{Origin:'https://mlam.example','Sec-Fetch-Site':'same-origin'}})),true);
  for(const headers of [{},{Origin:'https://evil.example'},{Origin:'https://mlam.example','Sec-Fetch-Site':'cross-site'}]) assert.equal(trustedOrigin(new Request('http://127.0.0.1:4180/api/products',{headers})),false);
  if(old) process.env.MLAM_ORIGIN=old; else delete process.env.MLAM_ORIGIN;
});
test('combined site uses its own routes and never trusts platform-auth headers', () => {
  const front = readFileSync(new URL('../app/storefront.tsx',import.meta.url),'utf8');
  assert.ok(front.includes('/checkout?product=')); assert.ok(front.includes('STUDIO PRO')); assert.ok(front.includes('RotatingLogo'));
  const admin = readFileSync(new URL('../lib/admin.ts',import.meta.url),'utf8'); assert.ok(admin.includes('adminSupabase')); assert.ok(admin.includes('verifiedCustomer')); assert.ok(admin.includes('configuredAdminEmail')); assert.ok(!admin.includes('oai-authenticated'));
  const checkout = readFileSync(new URL('../app/checkout/page.tsx',import.meta.url),'utf8'); assert.ok(checkout.includes('CheckoutForm'));
  const checkoutForm = readFileSync(new URL('../app/checkout/checkout-form.tsx',import.meta.url),'utf8'); assert.ok(checkoutForm.includes('disabled'));
});
