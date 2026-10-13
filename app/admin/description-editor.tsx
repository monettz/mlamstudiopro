'use client';
import { useState,type FormEvent } from 'react';
import { languageOptions,languageDirection,type InterfaceLanguage } from '@/lib/languages';
import { builtInTranslations,readDescriptionTranslations,type DescriptionTranslations } from '@/lib/product-descriptions';

export function DescriptionFields({value,onChange,disabled=false,includeEnglish=true}:{value:DescriptionTranslations;onChange:(next:DescriptionTranslations)=>void;disabled?:boolean;includeEnglish?:boolean}){
  const [language,setLanguage]=useState<InterfaceLanguage>(includeEnglish?'en':'sw');
  return <fieldset className="product-language-editor" disabled={disabled}><legend>Product description translations</legend><p>Enter each translation in its own language. These descriptions appear on product cards and in View details. No automatic translation service is connected.</p><label>Translation language<select value={language} onChange={event=>setLanguage(event.target.value as InterfaceLanguage)}>{languageOptions.filter(option=>includeEnglish||option.code!=='en').map(option=><option value={option.code} key={option.code}>{option.name}</option>)}</select></label><label>{languageOptions.find(option=>option.code===language)!.name} description<textarea lang={language} dir={languageDirection(language)} value={value[language]||''} maxLength={4000} onChange={event=>onChange({...value,[language]:event.target.value})} placeholder="Enter this product description in the selected language"/></label><small>{Object.values(value).filter(text=>text?.trim()).length} translations entered. Missing translations display English with a notice. Keep all translations up to date when changing product copy.</small></fieldset>;
}

export default function DescriptionEditor({product,onClose,onSaved}:{product:{id:string;name:string;description:string;description_translations?:string};onClose:()=>void;onSaved:()=>Promise<void>}){
  const [value,setValue]=useState<DescriptionTranslations>({en:product.description,...builtInTranslations(product),...readDescriptionTranslations(product.description_translations)});
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError('');
    try{const response=await fetch(`/api/products/${encodeURIComponent(product.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({description_translations:value})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to save descriptions');await onSaved();onClose();}
    catch(error){setError(error instanceof Error?error.message:'Unable to save descriptions');}finally{setBusy(false);}
  }
  return <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label={`Edit descriptions for ${product.name}`} dir="ltr"><button className="modal-close" type="button" aria-label="Close description editor" disabled={busy} onClick={onClose}>×</button><h2>{product.name}</h2><form className="admin-form" onSubmit={submit}><DescriptionFields value={value} onChange={setValue} disabled={busy}/><button className="button primary" disabled={busy}>{busy?'Saving…':'Save descriptions'}</button>{error&&<p role="alert">{error}</p>}</form></section></div>;
}
