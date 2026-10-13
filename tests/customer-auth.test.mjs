import { test,after } from 'node:test';import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';import { tmpdir } from 'node:os';import { resolve } from 'node:path';import { randomBytes } from 'node:crypto';
const folder=mkdtempSync(resolve(tmpdir(),'mlam-customer-test-'));process.env.MLAM_DATA_DIR=folder;
const runtime=await import('../lib/node-runtime.mjs');const auth=await import('../lib/customer-auth.mjs');const owner=await import('../lib/auth-core.mjs');const rate=await import('../lib/rate-limit.mjs');runtime.migrate();
after(()=>{runtime.rawDatabase().close();assert.ok(folder.startsWith(resolve(tmpdir())+'\\')||folder.startsWith(resolve(tmpdir())+'/'));rmSync(folder,{recursive:true,force:true});});
const password=randomBytes(24).toString('hex');const details={email:'Customer@Example.Test',fullName:'Test Customer',password};
test('registration creates an unverified hashed customer, never an administrator',async()=>{
  const result=await auth.registerCustomer(details);assert.equal(result.status,202);
  const row=runtime.rawDatabase().prepare('SELECT * FROM customers').get();assert.equal(row.email,'customer@example.test');assert.equal(row.email_verified_at,null);assert.notEqual(row.password_hash,password);
  assert.equal(runtime.rawDatabase().prepare('SELECT COUNT(*) AS count FROM admin_accounts').get().count,0);
  assert.equal(runtime.rawDatabase().prepare('SELECT COUNT(*) AS count FROM customer_sessions').get().count,0);
});
test('duplicate signup gives same response and does not reset the existing password',async()=>{
  const before=runtime.rawDatabase().prepare('SELECT password_hash FROM customers').get().password_hash;
  const duplicate=await auth.registerCustomer({...details,password:randomBytes(24).toString('hex')});assert.equal(duplicate.status,202);assert.equal(duplicate.message,auth.REGISTER_NOTICE);
  assert.equal(runtime.rawDatabase().prepare('SELECT password_hash FROM customers').get().password_hash,before);
});
test('wrong password and unknown email share status/error; valid session is revocable and not an admin session',async()=>{
  const a=await auth.loginCustomer({...details,password:'wrong'});const b=await auth.loginCustomer({email:'absent@example.test',password:'wrong'});assert.equal(a.status,401);assert.equal(b.status,401);assert.equal(a.error,b.error);
  const result=await auth.loginCustomer(details);assert.equal(result.status,200);const user=auth.customerSession(result.token);assert.equal(user.email,'customer@example.test');assert.equal(user.email_verified_at,null);assert.equal(owner.sessionUser(result.token),null);
  assert.notEqual(runtime.rawDatabase().prepare('SELECT token_hash FROM customer_sessions').get().token_hash,result.token);
  auth.revokeCustomerSession(result.token);assert.equal(auth.customerSession(result.token),null);
});
test('customer login limits cannot be bypassed by email case or whitespace',async()=>{
  rate.resetQuota('customer-login-email','customer@example.test');for(let i=0;i<5;i++)assert.equal((await auth.loginCustomer({email:i%2?' CUSTOMER@EXAMPLE.TEST ':details.email,password:null})).status,401);
  const limited=await auth.loginCustomer(details);assert.equal(limited.status,429);assert.ok(limited.retryAfter>0);
});
test('short passwords and open-redirect targets are rejected',async()=>{
  assert.equal((await auth.registerCustomer({...details,password:'short'})).status,400);
  for(const target of ['https://evil.test','//evil.test','/\\evil.test','/admin','/api/admin/logout'])assert.equal(auth.safeAccountReturn(target),'/account');
  assert.equal(auth.safeAccountReturn('/checkout?product=voice-midi'),'/checkout?product=voice-midi');
});
