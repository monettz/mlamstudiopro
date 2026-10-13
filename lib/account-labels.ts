import { validLanguage,type InterfaceLanguage } from './languages';
type AccountLabels={overview:string;profile:string;verified:string;show:string;hide:string;setup:string};
const labels:Record<InterfaceLanguage,AccountLabels>={
en:{overview:'Overview',profile:'Account details',verified:'Email verified',show:'Show password',hide:'Hide password',setup:'Account sign-in is not available yet. Please check back soon.'},
sw:{overview:'Muhtasari',profile:'Taarifa za akaunti',verified:'Email imethibitishwa',show:'Onyesha nenosiri',hide:'Ficha nenosiri',setup:'Huduma ya kuingia kwenye akaunti bado haipatikani. Tafadhali jaribu baadaye.'},
fr:{overview:'Vue d’ensemble',profile:'Détails du compte',verified:'E-mail confirmé',show:'Afficher le mot de passe',hide:'Masquer le mot de passe',setup:'La connexion aux comptes n’est pas encore disponible. Réessayez bientôt.'},
es:{overview:'Resumen',profile:'Datos de la cuenta',verified:'Correo verificado',show:'Mostrar contraseña',hide:'Ocultar contraseña',setup:'El acceso a las cuentas aún no está disponible. Vuelve a intentarlo pronto.'},
de:{overview:'Übersicht',profile:'Kontodetails',verified:'E-Mail bestätigt',show:'Passwort anzeigen',hide:'Passwort verbergen',setup:'Die Kontoanmeldung ist noch nicht verfügbar. Versuche es später erneut.'},
pt:{overview:'Visão geral',profile:'Dados da conta',verified:'E-mail confirmado',show:'Mostrar senha',hide:'Ocultar senha',setup:'O acesso às contas ainda não está disponível. Tente novamente em breve.'},
it:{overview:'Panoramica',profile:'Dettagli account',verified:'E-mail confermata',show:'Mostra password',hide:'Nascondi password',setup:'L’accesso agli account non è ancora disponibile. Riprova più tardi.'},
ar:{overview:'نظرة عامة',profile:'تفاصيل الحساب',verified:'البريد مؤكّد',show:'إظهار كلمة المرور',hide:'إخفاء كلمة المرور',setup:'تسجيل الدخول إلى الحسابات غير متاح بعد. حاول مجدداً لاحقاً.'},
zh:{overview:'概览',profile:'账户信息',verified:'邮箱已确认',show:'显示密码',hide:'隐藏密码',setup:'账户登录尚不可用，请稍后再试。'},
ja:{overview:'概要',profile:'アカウント情報',verified:'メール確認済み',show:'パスワードを表示',hide:'パスワードを隠す',setup:'アカウントへのログインはまだ利用できません。後でもう一度お試しください。'},
hi:{overview:'सारांश',profile:'खाते की जानकारी',verified:'ईमेल सत्यापित',show:'पासवर्ड दिखाएँ',hide:'पासवर्ड छिपाएँ',setup:'खाते में साइन इन अभी उपलब्ध नहीं है। कृपया बाद में फिर कोशिश करें।'},
ru:{overview:'Обзор',profile:'Данные аккаунта',verified:'Почта подтверждена',show:'Показать пароль',hide:'Скрыть пароль',setup:'Вход в аккаунт пока недоступен. Повторите попытку позже.'},
};
export function accountLabels(language:unknown):AccountLabels {return labels[validLanguage(language)];}
const continueLabels:Record<InterfaceLanguage,string>={en:'or continue with',sw:'au endelea kwa',fr:'ou continuer avec',es:'o continuar con',de:'oder fortfahren mit',pt:'ou continuar com',it:'oppure continua con',ar:'أو تابع باستخدام',zh:'或使用以下方式继续',ja:'または次の方法で続ける',hi:'या इससे जारी रखें',ru:'или продолжить с'};
export function accountContinueLabel(language:unknown):string{return continueLabels[validLanguage(language)];}
