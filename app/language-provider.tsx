'use client';
import { createContext,useContext,useEffect,useState } from 'react';
import { english,validLanguage,dictionaryFor,languageDirection,languageOptions,type TranslationKey } from '@/lib/languages';
import { usePathname } from 'next/navigation';
type LanguageContext = {language:string;setLanguage:(code:string)=>void;t:(key:TranslationKey)=>string};
const Context=createContext<LanguageContext>({language:'en',setLanguage:()=>{},t:key=>english[key]});
export const useLanguage=()=>useContext(Context);
export default function LanguageProvider({initialLanguage,children}:{initialLanguage:string;children:React.ReactNode}) {
  const [language,setValue]=useState(validLanguage(initialLanguage));
  const dictionary=dictionaryFor(language);
  function setLanguage(code:string){const next=validLanguage(code);setValue(next);document.cookie=`mlam_language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}
  useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir=languageDirection(language);},[language]);
  return <Context.Provider value={{language,setLanguage,t:key=>dictionary[key]}}><CustomerUtility/>{children}</Context.Provider>;
}
function CustomerUtility() {
  const {language,setLanguage,t}=useLanguage();const path=usePathname();
  const [signedIn,setSignedIn]=useState(false);
  useEffect(()=>{let live=true;fetch('/api/account/session').then(r=>r.ok?r.json():null).then(data=>{if(live)setSignedIn(!!data?.user);}).catch(()=>{});return()=>{live=false;};},[path]);
  const selector=<label className="language-control"><span aria-hidden="true">🌐</span><span>{t('language')}</span><select aria-label={t('language')} value={language} dir="ltr" onChange={event=>setLanguage(event.target.value)}>{languageOptions.map(({code,name})=><option value={code} key={code} lang={code}>{name}</option>)}</select></label>;
  if(path.startsWith('/account/')) return <header className="account-public-utility account-access-utility"><a href="/" className="account-store-return">← {t('back')}</a>{selector}</header>;
  // ModernNav and ModernFooter provide the modern capsule navbar and language selector across storefront pages
  return null;
}
