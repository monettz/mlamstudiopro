import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve,dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createSupabaseFixture } from './supabase-fixture.mjs';
const folder=mkdtempSync(resolve(tmpdir(),'mlam-supabase-test-'));process.env.MLAM_DATA_DIR=folder;
const runtime=await import('../lib/node-runtime.mjs');runtime.migrate();
const auth=await import('../lib/supabase-auth.mjs');const adminAuth=await import('../lib/admin-supabase-auth.mjs');const rate=await import('../lib/rate-limit.mjs');
const fixture=await createSupabaseFixture();
const config=auth.supabaseConfiguration({MLAM_ORIGIN:'http://127.0.0.1:4180',SUPABASE_URL:fixture.url,SUPABASE_PUBLISHABLE_KEY:fixture.key});
function browser(admin=false) {
  const jar=new Map(),writes=[],headers={};
  const client=()=>{const createClient=admin?auth.createAdminClient:auth.createCustomerClient;return createClient({getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:(values,cache)=>{
    for(const cookie of values){writes.push(cookie);if(cookie.options.maxAge===0)jar.delete(cookie.name);else jar.set(cookie.name,cookie.value);}Object.assign(headers,cache);
  }},config);};
  return {jar,writes,headers,client};
}
after(async()=>{await fixture.close();runtime.rawDatabase().close();assert.equal(dirname(folder),resolve(tmpdir()));rmSync(folder,{recursive:true,force:true});});

test('Supabase configuration rejects privileged keys, unsafe origins and non-local HTTP',()=>{
  const valid={MLAM_ORIGIN:'https://mlam.example',SUPABASE_URL:'https://project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'};
  assert.ok(auth.supabaseConfiguration(valid));assert.equal(auth.supabaseConfiguration({}),null);
  for(const key of ['sb_secret_private',`e30.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.test`])assert.equal(auth.supabaseConfiguration({...valid,SUPABASE_PUBLISHABLE_KEY:key}),null);
  for(const url of ['http://project.supabase.co','https://user:password@project.supabase.co','https://project.supabase.co/other'])assert.equal(auth.supabaseConfiguration({...valid,SUPABASE_URL:url}),null);
  assert.equal(auth.supabaseConfiguration({...valid,MLAM_ORIGIN:'http://public.example'}),null);
  assert.equal(auth.supabaseConfiguration({...valid,SUPABASE_URL:fixture.url}),null);
});

test('missing configuration fails closed: no local customer session fallback',async()=>{
  assert.equal((await auth.supabasePasswordLogin(null,{})).code,'AUTH_NOT_CONFIGURED');
  assert.equal((await auth.supabaseSignup(null,{},null)).status,503);
  assert.equal((await auth.googleAuthorization(null,null)).status,503);
  assert.equal(await auth.verifiedCustomer(null),null);
});

test('Supabase signup, confirmed login, secure cookies, refresh, metadata isolation and logout',async()=>{
  const browserState=browser();const password=randomBytes(24).toString('hex');
  const details={email:' SUPABASE-FIXTURE@EXAMPLE.TEST ',password,fullName:'Test Customer',role:'admin',email_verified_at:'spoofed'};
  const created=await auth.supabaseSignup(browserState.client(),details,'//evil.test',config);
  assert.equal(created.status,202);assert.equal(await auth.verifiedCustomer(browserState.client()),null);
  const repeated=await auth.supabaseSignup(browserState.client(),{...details,password:'different-long-password'},'/account',config);assert.deepEqual(repeated,created);
  const unconfirmed=await auth.supabasePasswordLogin(browserState.client(),details);assert.equal(unconfirmed.status,401);
  fixture.confirm('supabase-fixture@example.test');
  const wrong=await auth.supabasePasswordLogin(browserState.client(),{...details,password:'wrong'});
  const unknown=await auth.supabasePasswordLogin(browserState.client(),{email:'absent@example.test',password:'wrong'});assert.equal(wrong.error,unknown.error);
  assert.equal((await auth.supabasePasswordLogin(browserState.client(),details)).status,200);
  assert.equal((await auth.verifiedCustomer(browserState.client())).email,'supabase-fixture@example.test');
  assert.ok(browserState.writes.some(cookie=>cookie.name===auth.SUPABASE_COOKIE));
  assert.ok(browserState.writes.every(cookie=>cookie.options.httpOnly && cookie.options.sameSite==='lax' && cookie.options.path==='/'));
  assert.match(browserState.headers['Cache-Control'],/private.*no-store/);
  const secure=auth.supabaseConfiguration({MLAM_ORIGIN:'https://mlam.example',SUPABASE_URL:'https://project.supabase.co',SUPABASE_PUBLISHABLE_KEY:fixture.key});assert.equal(secure.secure,true);
  const session=fixture.expire('supabase-fixture@example.test');
  const before=browserState.writes.length;
  browserState.jar.set(auth.SUPABASE_COOKIE,`base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`);
  assert.ok(await auth.verifiedCustomer(browserState.client()));assert.ok(browserState.writes.length>before);assert.ok(fixture.requests.some(request=>request.grant==='refresh_token'));
  await browserState.client().auth.signOut({scope:'local'});assert.equal(await auth.verifiedCustomer(browserState.client()),null);
  assert.equal(runtime.rawDatabase().prepare('SELECT COUNT(*) AS n FROM customers').get().n,0);
  assert.equal(runtime.rawDatabase().prepare('SELECT COUNT(*) AS n FROM admin_accounts').get().n,0);
});

test('Google PKCE has minimal scopes, safe callback, HttpOnly verifier and requires the original browser',async()=>{
  const state=browser();const result=await auth.googleAuthorization(state.client(),'/checkout?product=voice-midi',config);
  assert.equal(result.status,200);const url=new URL(result.url);
  assert.equal(url.searchParams.get('provider'),'google');assert.equal(url.searchParams.get('scopes'),'openid email profile');
  assert.equal(url.searchParams.get('code_challenge_method'),'s256');assert.equal(new URL(url.searchParams.get('redirect_to')).searchParams.get('next'),'/checkout?product=voice-midi');
  assert.ok(state.writes.some(cookie=>cookie.name.endsWith('-code-verifier') && cookie.options.httpOnly));fixture.allowGoogle(result.url);
  assert.ok((await browser().client().auth.exchangeCodeForSession('fixture-google-code')).error);
  assert.equal((await state.client().auth.exchangeCodeForSession('fixture-google-code')).error,null);
  const user=await auth.verifiedCustomer(state.client());assert.equal(user.email,'google-fixture@example.test');assert.ok(user.email_verified_at);assert.equal(user.role,undefined);
  assert.ok(fixture.requests.some(request=>request.path==='/auth/v1/user'));
});

test('forged session identity is not trusted; per-email limit survives fresh clients',async()=>{
  const state=browser();const fake={access_token:'forged',refresh_token:'forged',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'spoof',email:'owner@example.test',user_metadata:{role:'admin'}}};
  state.jar.set(auth.SUPABASE_COOKIE,`base64-${Buffer.from(JSON.stringify(fake)).toString('base64url')}`);assert.equal(await auth.verifiedCustomer(state.client()),null);
  rate.resetQuota('supabase-login-email','limit@example.test');
  for(let i=0;i<5;i++)assert.equal((await auth.supabasePasswordLogin(browser().client(),{email:i%2?' LIMIT@EXAMPLE.TEST ':'limit@example.test',password:'wrong'})).status,401);
  const blocked=await auth.supabasePasswordLogin(browser().client(),{email:'limit@example.test',password:'wrong'});assert.equal(blocked.status,429);assert.ok(blocked.retryAfter>0);
});

test('Admin Supabase login is allowlisted, verified, rate-limited and cookie-isolated',async()=>{
  const email='admin-owner@example.test',password=randomBytes(24).toString('hex');
  assert.equal(adminAuth.configuredAdminEmail({}),null);
  assert.equal(adminAuth.configuredAdminEmail({MLAM_ADMIN_EMAIL:' ADMIN-OWNER@EXAMPLE.TEST '}),email);
  assert.equal(adminAuth.isAuthorizedAdmin({email,email_verified_at:'verified',user_metadata:{role:'admin'}},'different@example.test'),false);
  assert.equal(adminAuth.isAuthorizedAdmin({email,email_verified_at:null},email),false);
  assert.equal(adminAuth.isAuthorizedAdmin({email,email_verified_at:'verified',user_metadata:{role:'customer'}},email),true);
  assert.equal((await adminAuth.supabaseAdminPasswordLogin(null,{email,password},email)).status,503);

  const customer=browser();
  assert.equal((await auth.supabaseSignup(customer.client(),{email,password,fullName:'Admin Owner'},'/account',config)).status,202);
  fixture.confirm(email);
  const beforeDenied=fixture.requests.filter(request=>request.path==='/auth/v1/token'&&request.grant==='password').length;
  assert.equal((await adminAuth.supabaseAdminPasswordLogin(browser(true).client(),{email:'another@example.test',password},email)).status,401);
  assert.equal(fixture.requests.filter(request=>request.path==='/auth/v1/token'&&request.grant==='password').length,beforeDenied,'non-allowlisted addresses must not be sent to Supabase');
  assert.equal((await adminAuth.supabaseAdminPasswordLogin(browser(true).client(),{email,password:'wrong'},email)).status,401);
  const admin=browser(true);
  assert.equal((await adminAuth.supabaseAdminPasswordLogin(admin.client(),{email:` ${email.toUpperCase()} `,password},email)).status,200);
  assert.equal((await auth.verifiedCustomer(admin.client())).email,email);
  assert.ok(admin.writes.some(cookie=>cookie.name===auth.SUPABASE_ADMIN_COOKIE));
  assert.ok(admin.writes.every(cookie=>cookie.options.httpOnly&&cookie.options.sameSite==='lax'));
  assert.equal(customer.jar.has(auth.SUPABASE_ADMIN_COOKIE),false);
  assert.equal(admin.jar.has(auth.SUPABASE_COOKIE),false);
});

test('provider failure does not enable local signup/login',async()=>{
  fixture.fail();const result=await auth.supabasePasswordLogin(browser().client(),{email:'outage@example.test',password:'fixture-only-password'});
  assert.equal(result.status,503);assert.equal(result.code,'AUTH_UNAVAILABLE');
  assert.equal(runtime.rawDatabase().prepare('SELECT COUNT(*) AS n FROM customers').get().n,0);
});
