import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../lib/manual-order.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {}; vm.runInNewContext(source, { exports, Object, Number, String, Math });
const { parseManualOrder } = exports;
const valid = { product_id: 'voice-midi', customer_email: ' Buyer@Example.TEST ', customer_phone: '+255 712 345 678', amount: '65000', currency: 'tzs', payment_method: 'mpesa', provider_ref: ' sjk4xy7q2p ' };

test('a valid M-Pesa payment is normalised to minor units, uppercase code and a license by default', () => {
  const { order } = parseManualOrder(valid);
  assert.equal(order.email, 'buyer@example.test');
  assert.equal(order.phone, '+255712345678');
  assert.equal(order.amountMinor, 6500000);
  assert.equal(order.currency, 'TZS');
  assert.equal(order.reference, 'SJK4XY7Q2P');
  assert.equal(order.issueLicense, true);
  assert.equal(order.maxDownloads, 5);
  assert.equal(parseManualOrder({ ...valid, issue_license: false }).order.issueLicense, false);
});

test('bad payments are refused with a reason the owner can act on', () => {
  assert.match(parseManualOrder({ ...valid, amount: 0 }).error, /amount/);
  assert.match(parseManualOrder({ ...valid, customer_email: 'not-an-email' }).error, /email/);
  assert.match(parseManualOrder({ ...valid, currency: 'KES' }).error, /TZS or USD/);
  assert.match(parseManualOrder({ ...valid, payment_method: 'paypal' }).error, /paid/);
  assert.match(parseManualOrder({ ...valid, provider_ref: '' }).error, /transaction code/);
  assert.match(parseManualOrder({ ...valid, provider_ref: 'DROP TABLE;' }).error, /letters, numbers/);
  assert.match(parseManualOrder({ ...valid, max_downloads: 0 }).error, /Download limit/);
  assert.ok('order' in parseManualOrder({ ...valid, payment_method: 'cash', provider_ref: '' }), 'cash needs no transaction code');
});
