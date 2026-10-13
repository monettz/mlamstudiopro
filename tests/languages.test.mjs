import { test } from 'node:test';import assert from 'node:assert/strict';import { readFileSync } from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const compile=name=>ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const international={};vm.runInNewContext(compile('international-languages'),{exports:international});
const exports={};vm.runInNewContext(compile('languages'),{exports,Intl,require:name=>{assert.equal(name,'./international-languages');return international;}});
const account={};vm.runInNewContext(compile('account-labels'),{exports:account,require:name=>{assert.equal(name,'./languages');return exports;}});
test('one selector offers 12 implemented international languages, English first and single names',()=>{
  assert.equal(exports.languageOptions.length,12);assert.equal(exports.languageOptions[0].code,'en');
  assert.equal(new Set(exports.languageCodes).size,exports.languageCodes.length);
  assert.equal(new Set(exports.languageOptions.map(option=>option.name)).size,12);
  assert.ok(exports.languageOptions.every(option=>option.name&&!option.name.includes(' — ')));
  assert.equal(exports.swahili.login,'Ingia');assert.equal(exports.dictionaryFor('ja').login,'ログイン');
});
test('every offered dictionary has all UI keys and non-empty translated strings',()=>{
  const expected=Object.keys(exports.english).sort();
  for(const code of exports.languageCodes){const dictionary=exports.dictionaryFor(code);assert.deepEqual(Object.keys(dictionary).sort(),expected,code);assert.ok(Object.values(dictionary).every(value=>typeof value==='string'&&value.trim()),code);if(code!=='en')assert.notEqual(dictionary.loginTitle,exports.english.loginTitle,code);}
});
test('new visitors and unsupported or malformed preferences start in English; Arabic is RTL',()=>{
  for(const input of [undefined,null,'','aa','<script>','EN','__proto__']){assert.equal(exports.validLanguage(input),'en');assert.equal(exports.dictionaryFor(input),exports.english);}
  assert.equal(exports.interfaceLanguage('ja'),'ja');assert.equal(exports.validLanguage('sw'),'sw');
  assert.equal(exports.languageDirection('ar'),'rtl');assert.equal(exports.languageDirection('en'),'ltr');assert.equal(exports.languageDirection('ja'),'ltr');
});
test('customer account controls are localized in every offered language',()=>{
  const keys=Object.keys(account.accountLabels('en')).sort();
  for(const language of exports.languageCodes){const labels=account.accountLabels(language);assert.deepEqual(Object.keys(labels).sort(),keys);assert.ok(Object.values(labels).every(value=>value.trim()));assert.ok(account.accountContinueLabel(language));if(language!=='en')assert.notEqual(labels.show,account.accountLabels('en').show);}
  assert.equal(account.accountContinueLabel('sw'),'au endelea kwa');assert.equal(account.accountLabels('not-supported').show,'Show password');
});
