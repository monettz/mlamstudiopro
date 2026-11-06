import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL('../lib/dev-admin.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function load(env) {
  const exports = {};
  vm.runInNewContext(source, { exports, require, process: { env }, Buffer, Date, Math, Number, URL, Set, globalThis: {} });
  return exports;
}

test('local test sign-in is off in production and without the explicit flag', () => {
  assert.equal(load({ NODE_ENV: 'production', MLAM_DEV_ADMIN: '1' }).devAdminEnabled({ NODE_ENV: 'production', MLAM_DEV_ADMIN: '1' }), false);
  assert.equal(load({ NODE_ENV: 'development' }).devAdminEnabled({ NODE_ENV: 'development' }), false);
  assert.equal(load({ NODE_ENV: 'development', MLAM_DEV_ADMIN: 'true' }).devAdminEnabled({ NODE_ENV: 'development', MLAM_DEV_ADMIN: 'true' }), false);
  assert.equal(load({ NODE_ENV: 'development', MLAM_DEV_ADMIN: '1' }).devAdminEnabled({ NODE_ENV: 'development', MLAM_DEV_ADMIN: '1' }), true);
});

test('only loopback hosts can use it', () => {
  const { isLoopbackRequest } = load({ NODE_ENV: 'development', MLAM_DEV_ADMIN: '1' });
  assert.equal(isLoopbackRequest(new Request('http://127.0.0.1:4180/api/admin/login')), true);
  assert.equal(isLoopbackRequest(new Request('http://localhost:4180/api/admin/login')), true);
  assert.equal(isLoopbackRequest(new Request('https://mlam.example/api/admin/login')), false);
  assert.equal(isLoopbackRequest(new Request('http://192.168.1.20:4180/api/admin/login')), false);
});

test('sessions are signed: a valid one reads back, a tampered or foreign one does not', () => {
  const dev = load({ NODE_ENV: 'development', MLAM_DEV_ADMIN: '1' });
  const session = dev.createDevAdminSession(' Owner@Example.com ');
  assert.equal(dev.readDevAdminSession(session.value).email, 'owner@example.com');
  const [email, expires, sig] = session.value.split('.');
  assert.equal(dev.readDevAdminSession(`${Buffer.from('attacker@example.com').toString('base64url')}.${expires}.${sig}`), null);
  assert.equal(dev.readDevAdminSession(`${email}.${Number(expires) + 999999}.${sig}`), null);
  assert.equal(load({ NODE_ENV: 'development', MLAM_DEV_ADMIN: '1' }).readDevAdminSession(session.value), null, 'another process key rejects it');
  assert.equal(load({ NODE_ENV: 'production', MLAM_DEV_ADMIN: '1' }).readDevAdminSession(session.value), null);
  assert.equal(dev.readDevAdminSession(undefined), null);
});
