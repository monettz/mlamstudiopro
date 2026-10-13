'use client';
import { useEffect,useState,type FormEvent } from 'react';
import { useLanguage } from '../language-provider';
import { authCopy } from '@/lib/auth-copy';
import { accountLabels,accountContinueLabel } from '@/lib/account-labels';
import AccountIcon from './icons';
export default function CustomerAuthForm({mode,next,configured,callbackFailed=false}:{mode:'login'|'register';next:string;configured:boolean;callbackFailed?:boolean}) {
  const {t,language}=useLanguage();const copy=authCopy(language);const labels=accountLabels(language);const register=mode==='register';const [busy,setBusy]=useState(false);const [showPassword,setShowPassword]=useState(false);
  const [message,setMessage]=useState('');const [created,setCreated]=useState(false);const [until,setUntil]=useState(0);const [remaining,setRemaining]=useState(0);
  useEffect(()=>{const update=()=>setRemaining(Math.max(0,Math.ceil((until-Date.now())/1000)));update();if(!until)return;const timer=setInterval(update,1000);return()=>clearInterval(timer);},[until]);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!configured||busy||Date.now()<until)return;
    const element=event.currentTarget;const form=new FormData(element);
    if(register&&form.get('password')!==form.get('confirm')){setMessage(t('passwordMismatch'));return;}
    setBusy(true);setMessage('');
    try {
      const response=await fetch(`/api/account/${register?'register':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password'),fullName:form.get('fullName'),next})});
      if(response.status===429){const seconds=Number(response.headers.get('Retry-After'));setUntil(Date.now()+(Number.isFinite(seconds)&&seconds>0?seconds:60)*1000);setMessage(t('tooMany'));return;}
      if(response.status===503){const data=await response.json();setMessage(data.code==='AUTH_NOT_CONFIGURED'?labels.setup:copy.serviceError);return;}
      if(!response.ok){setMessage(t(register?'invalidDetails':'invalidCredentials'));return;}
      element.reset();
      if(register){setCreated(true);setMessage(copy.registered);}else location.assign(next);
    }catch{setMessage(t('connectionError'));}finally{setBusy(false);}
  }
  async function google(){
    if(!configured||busy||Date.now()<until)return;setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/account/google',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({next})});
      if(response.status===429){const seconds=Number(response.headers.get('Retry-After'));setUntil(Date.now()+(Number.isFinite(seconds)&&seconds>0?seconds:60)*1000);setMessage(t('tooMany'));return;}
      const data=await response.json();
      if(!response.ok||!data.url){setMessage(data.code==='AUTH_NOT_CONFIGURED'?labels.setup:copy.googleError);return;}
      location.assign(data.url);
    }catch{setMessage(t('connectionError'));}finally{setBusy(false);}
  }
  return <main className="customer-auth-page mlam-access-page"><a className="brand access-brand" href="/" dir="ltr"><img src="/mlam-mark-3d-green.png" alt=""/><span><b>MLAM</b> STUDIO PRO<small>{t('customerAccount')}</small></span></a>
    <section className="customer-auth-card mlam-access-card" aria-labelledby="mlam-auth-title">
      <header className="access-heading"><h1 id="mlam-auth-title">{t(register?'registerTitle':'loginTitle')}</h1><p>{register?copy.signupIntro:copy.loginIntro}</p></header>
      <nav className="access-mode-tabs" aria-label={t('customerAccount')}><a href={`/account/login?next=${encodeURIComponent(next)}`} aria-current={!register?'page':undefined}>{t('login')}</a><a href={`/account/register?next=${encodeURIComponent(next)}`} aria-current={register?'page':undefined}>{t('register')}</a></nav>
      {callbackFailed&&<p className="access-feedback access-error" role="alert">{copy.callbackFailed}</p>}
      <form className="customer-access-form" onSubmit={submit}>
        {register&&<label>{t('fullName')}<input name="fullName" placeholder={t('fullName')} autoComplete="name" required minLength={2} maxLength={120} disabled={!configured||busy}/></label>}
        <label>{t('email')}<input type="email" name="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} disabled={!configured||busy}/></label>
        <label htmlFor="mlam-password">{t('password')}</label><div className="access-password"><input id="mlam-password" type={showPassword?'text':'password'} name="password" placeholder="••••••••••" autoComplete={register?'new-password':'current-password'} required minLength={register?15:undefined} maxLength={256} disabled={!configured||busy}/><button type="button" className="password-visibility" aria-controls="mlam-password" aria-pressed={showPassword} aria-label={showPassword?labels.hide:labels.show} onClick={()=>setShowPassword(value=>!value)} disabled={busy}><AccountIcon name={showPassword?'eye-off':'eye'}/></button></div>
        {register&&<><label>{t('confirm')}<input type={showPassword?'text':'password'} name="confirm" placeholder="••••••••••" autoComplete="new-password" required minLength={15} maxLength={256} disabled={!configured||busy}/></label><p className="access-password-help">{t('passwordHelp')}</p></>}
        <button className="button access-submit" disabled={!configured||busy||remaining>0}>{busy?t('working'):remaining>0?`${t('working')} (${Math.ceil(remaining/60)} min)`:t(register?'register':'login')}<AccountIcon name="arrow"/></button>
      </form>
      {message&&<p className="access-feedback" role="status">{message}</p>}{created&&<a className="access-confirm-link" href={`/account/login?next=${encodeURIComponent(next)}`}>{t('login')} →</a>}
      <div className="auth-divider access-divider"><span>{accountContinueLabel(language)}</span></div>
      <button type="button" className="button google-auth-button access-google" onClick={google} disabled={!configured||busy||remaining>0}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.7 2.9-4.3 2.9-7.6Z"/><path fill="#34A853" d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.7a6 6 0 0 1 0-3.4V7.6H3a10 10 0 0 0 0 8.8l3.4-2.7Z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-9 5.6l3.4 2.7C7.2 7.9 9.4 6.1 12 6.1Z"/></svg><span>{busy?t('working'):copy.google}</span></button>
      {!configured&&<p className="access-availability" role="status"><AccountIcon name="info"/><span>{labels.setup}</span></p>}
    </section><p className="access-footnote">{copy.verification}</p>
  </main>;
}
