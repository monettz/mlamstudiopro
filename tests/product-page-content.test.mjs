import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// lib/product-page-content.ts has no imports, so it can be transpiled and run alone.
const exports = {};
const source = readFileSync(new URL('../lib/product-page-content.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports });
const { readSteps, readSpecs, validSteps, validSpecs, DEFAULT_SPECS, MAX_STEPS, MAX_SPECS } = exports;
const plain = value => JSON.parse(JSON.stringify(value));

test('product page steps: trimmed, blank titles dropped, bad stored JSON is empty', () => {
  assert.deepEqual(plain(readSteps('[{"title":"  Listen ","text":" Capture   your voice "},{"title":"","text":"no title"},"x",null]')), [{ title: 'Listen', text: 'Capture your voice' }]);
  assert.deepEqual(plain(readSteps('{broken')), []);
  assert.deepEqual(plain(readSteps(undefined)), []);
  assert.equal(readSteps([{ title: 'a'.repeat(200), text: 'b'.repeat(900) }])[0].title.length, 60);
});

test('product page specs need both a name and a value', () => {
  assert.deepEqual(plain(readSpecs([{ label: 'Format', value: 'VST3' }, { label: 'Empty', value: '' }, { label: '', value: 'x' }])), [{ label: 'Format', value: 'VST3' }]);
  assert.ok(DEFAULT_SPECS.length > 0 && DEFAULT_SPECS.every(spec => spec.label && spec.value));
});

test('requests: non-lists and too many rows are refused; an empty list clears', () => {
  assert.equal(validSteps('nope'), null);
  assert.equal(validSpecs({}), null);
  assert.equal(validSteps(Array.from({ length: MAX_STEPS + 1 }, () => ({ title: 't', text: '' }))), null);
  assert.equal(validSpecs(Array.from({ length: MAX_SPECS + 1 }, () => ({ label: 'l', value: 'v' }))), null);
  assert.deepEqual(plain(validSteps([])), []);
  assert.deepEqual(plain(validSpecs([{ label: 'Latency', value: 'Zero' }])), [{ label: 'Latency', value: 'Zero' }]);
});

test('both databases get the page content columns', () => {
  const sqlite = readFileSync(new URL('../drizzle/0011_product_page_content.sql', import.meta.url), 'utf8');
  const postgres = readFileSync(new URL('../migrations/postgres/0001_product_page_content.sql', import.meta.url), 'utf8');
  for (const column of ['page_steps', 'page_specs']) { assert.ok(sqlite.includes(column)); assert.ok(postgres.includes(`ADD COLUMN IF NOT EXISTS ${column}`)); }
});
