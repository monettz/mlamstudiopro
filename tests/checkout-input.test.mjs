import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function module(name) {
  const exports={};const source=readFileSync(new URL(`../lib/${name}.ts`,import.meta.url),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Uint8Array,TextDecoder,Error,JSON});return exports;
}
const { checkoutInput }=module('checkout-input');const { boundedJson }=module('bounded-json');
const input={productId:'voice-midi',email:' Customer@Example.Test ',fullName:'Test Customer',paymentMethod:'mpesa'};
test('checkout normalizes email and ignores client-supplied price/paid status',()=>{
  const result=checkoutInput({...input,amount:0,paid:true});assert.equal(result.email,'customer@example.test');assert.ok(!('amount' in result));assert.ok(!('paid' in result));
});
test('invalid checkout types, email, names, product IDs and methods are rejected',()=>{
  for(const value of [null,[],{}, {...input,email:'wrong'}, {...input,email:5},{...input,fullName:'x'},{...input,fullName:'bad\nname'},{...input,productId:'../../releases'},{...input,paymentMethod:'cash'}])assert.equal(checkoutInput(value),null);
});
test('bounded input checks actual bytes and malformed JSON even without Content-Length',async()=>{
  assert.equal((await boundedJson(new Request('http://local',{method:'POST',body:JSON.stringify(input)}))).productId,'voice-midi');
  await assert.rejects(boundedJson(new Request('http://local',{method:'POST',body:'x'.repeat(4097)})));
  await assert.rejects(boundedJson(new Request('http://local',{method:'POST',body:'{'})));
});
