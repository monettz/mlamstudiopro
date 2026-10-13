'use client';
import { useLanguage } from './language-provider';
import { languageDirection,validLanguage } from '@/lib/languages';
import { productDescription,descriptionFallbackNotice } from '@/lib/product-descriptions';

export default function ProductDescription({product}:{product:{id:string;description:string;description_translations?:unknown}}){
  const {language}=useLanguage();const localized=productDescription(product,language);
  return <><p data-product-description={product.id} lang={localized.language} dir={languageDirection(localized.language)}>{localized.text}</p>{localized.isFallback&&<small className="description-language-note">{descriptionFallbackNotice[validLanguage(language)]}</small>}</>;
}
