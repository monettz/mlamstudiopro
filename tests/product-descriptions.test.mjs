import { test } from 'node:test';import assert from 'node:assert/strict';import { readFileSync } from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
const modules={};
for(const name of ['international-languages','languages','product-descriptions']){
  const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Intl,require:path=>{const dependency=modules[path.replace('./','')];assert.ok(dependency,path);return dependency;}});modules[name]=exports;
}
const {languageCodes}=modules.languages;
const {originalDescriptions,catalogDescriptions,productDescription,builtInTranslations,validateDescriptionTranslations,readDescriptionTranslations}=modules['product-descriptions'];

test('all six original product descriptions have complete translations in all 12 interface languages',()=>{
  for(const [id,sources] of Object.entries(originalDescriptions))for(const language of languageCodes){
    const product={id,description:sources[0],name:'Unchanged brand',price_cents:2900,image:'/original.png',status:'published'};
    const before=JSON.stringify(product);const selected=productDescription(product,language);
    assert.equal(selected.language,language);assert.equal(selected.text,catalogDescriptions[language][id]);assert.equal(selected.isFallback,false);assert.ok(selected.text.trim());
    if(language!=='en')assert.notEqual(selected.text,catalogDescriptions.en[id]);assert.equal(JSON.stringify(product),before);
  }
  assert.match(productDescription({id:'voice-midi',description:originalDescriptions['voice-midi'][0]},'en').text,/^Turn your voice/);
});
test('owner translations override catalog copy; no stale stock translation replaces changed owner copy',()=>{
  const original={id:'voice-midi',description:originalDescriptions['voice-midi'][0],description_translations:JSON.stringify({en:'Owner English copy',fr:'Texte du propriétaire'})};
  assert.equal(productDescription(original,'en').text,'Owner English copy');assert.equal(productDescription(original,'fr').text,'Texte du propriétaire');
  assert.equal(productDescription(original,'sw').text,catalogDescriptions.sw['voice-midi']);
  const changed={id:'voice-midi',description:'A new feature written by the owner'};
  assert.equal(Object.keys(builtInTranslations(changed)).length,0);
  assert.equal(productDescription(changed,'fr').text,changed.description);assert.equal(productDescription(changed,'fr').isFallback,true);
  const serialized=JSON.stringify({...builtInTranslations(original),...readDescriptionTranslations(original.description_translations)});
  assert.equal(productDescription({...original,description:'Owner English copy',description_translations:serialized},'ja').text,catalogDescriptions.ja['voice-midi']);
});
test('custom products use the requested translation and clearly identified English fallback',()=>{
  const product={id:'new-plugin',description:'English product description',description_translations:{sw:'Maelezo ya bidhaa',ar:'وصف المنتج'}};
  assert.equal(productDescription(product,'sw').text,'Maelezo ya bidhaa');assert.equal(productDescription(product,'ar').language,'ar');
  assert.equal(productDescription(product,'fr').language,'en');assert.equal(productDescription(product,'fr').isFallback,true);assert.equal(productDescription(product,undefined).isFallback,false);
  assert.equal(Object.keys(readDescriptionTranslations('{invalid')).length,0);
});
test('stored translations reject unsupported keys, arrays, objects and oversized descriptions',()=>{
  for(const input of [null,[],{xx:'copy'},{fr:42},{en:'x'.repeat(4001)},JSON.parse('{"__proto__":"bad"}')])assert.throws(()=>validateDescriptionTranslations(input));
  const value=validateDescriptionTranslations({fr:'  Texte français  ',ja:''});assert.equal(value.fr,'Texte français');assert.equal(Object.keys(value).length,1);
  assert.equal(Object.keys(validateDescriptionTranslations({})).length,0);
});
