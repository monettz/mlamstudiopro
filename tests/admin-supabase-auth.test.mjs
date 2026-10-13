import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const folder=mkdtempSync(resolve(tmpdir(),'mlam-admin-auth-test-'));
process.env.MLAM_DATA_DIR=folder;
const runtime=await import('../lib/node-runtime.mjs');
runtime.migrate();
const auth=await import('../lib/admin-supabase-auth.mjs');
const {resetQuota}=await import('../lib/rate-limit.mjs');
after(()=>{runtime.rawDatabase().close();rmSync(folder,{recursive:true,force:true});});

function provider({password='correct-password',confirmed=true,fail=false}={}) {
  const calls=[];
  return {calls,auth:{
    async signInWithPassword(input) {
      calls.push(input);
      if(fail) throw new Error('provider down');
      if(input.password!==password) return {data:{user:null,session:null},error:{status:400,code:'invalid_credentials'}};
      return {data:{user:{id:'owner-id',email:input.email,email_confirmed_at:confirmed?'2026-10-13T00:00:00Z':null,user_metadata:{role:'admin'}},session:{access_token:'fixture-token'}},error:null};
    },
    async signOut(){return {error:null};},
  }};
}

test('only configured, confirmed Supabase email is granted Admin login',async()=>{
  const email='owner@example.test';
  assert.equal(auth.configuredAdminEmail({}),null);
  assert.equal(auth.configuredAdminEmail({MLAM_ADMIN_EMAIL:' OWNER@EXAMPLE.TEST '}),email);
  assert.equal(auth.isAuthorizedAdmin({email,email_confirmed_at:'yes',user_metadata:{role:'admin'}},'other@example.test'),false);
  assert.equal(auth.isAuthorizedAdmin({email,email_confirmed_at:null},email),false);
  assert.equal(auth.isAuthorizedAdmin({email,email_confirmed_at:'yes',user_metadata:{role:'customer'}},email),true);

  assert.equal((await auth.supabaseAdminPasswordLogin(null,{email,password:'correct-password'},email)).status,503);
  const wrongAddress=provider();
  assert.equal((await auth.supabaseAdminPasswordLogin(wrongAddress,{email:'customer@example.test',password:'correct-password'},email)).status,401);
  assert.equal(wrongAddress.calls.length,0,'unapproved emails never reach Supabase password auth');
  const wrongPassword=provider();
  assert.equal((await auth.supabaseAdminPasswordLogin(wrongPassword,{email,password:'wrong'},email)).status,401);
  const unconfirmed=provider({confirmed:false});
  assert.equal((await auth.supabaseAdminPasswordLogin(unconfirmed,{email,password:'correct-password'},email)).status,401);
  const approved=provider();
  assert.deepEqual(await auth.supabaseAdminPasswordLogin(approved,{email:` ${email.toUpperCase()} `,password:'correct-password'},email),{status:200,ok:true});
  assert.equal(approved.calls[0].email,email);
  const unavailable=provider({fail:true});
  assert.equal((await auth.supabaseAdminPasswordLogin(unavailable,{email,password:'correct-password'},email)).status,503);
});

test('Admin email login has its own per-email cooldown',async()=>{
  const email='throttle-owner@example.test';
  resetQuota('admin-supabase-login-email',email);
  for(let i=0;i<5;i++) assert.equal((await auth.supabaseAdminPasswordLogin(provider({password:'right'}),{email,password:'wrong'},email)).status,401);
  const blocked=await auth.supabaseAdminPasswordLogin(provider(),{email,password:'right'},email);
  assert.equal(blocked.status,429);assert.ok(blocked.retryAfter>0);
});
