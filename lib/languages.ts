import { international } from './international-languages';
// Only offer implemented translations; English is the default, never inferred from browser locale.
export const languageOptions = [
  {code:'en',name:'English'}, {code:'sw',name:'Kiswahili'},
  {code:'fr',name:'Français'}, {code:'es',name:'Español'},
  {code:'de',name:'Deutsch'}, {code:'pt',name:'Português'},
  {code:'it',name:'Italiano'}, {code:'ar',name:'العربية'},
  {code:'zh',name:'简体中文'}, {code:'ja',name:'日本語'},
  {code:'hi',name:'हिन्दी'}, {code:'ru',name:'Русский'},
] as const;
export type InterfaceLanguage = typeof languageOptions[number]['code'];
export const languageCodes = languageOptions.map(option=>option.code);
export function validLanguage(value:unknown):InterfaceLanguage { return typeof value==='string'&&languageCodes.some(code=>code===value)?value as InterfaceLanguage:'en'; }
export const interfaceLanguage=validLanguage;
export function languageDirection(value:unknown):'ltr'|'rtl' { return validLanguage(value)==='ar'?'rtl':'ltr'; }
export function languageName(code:string,locale='en') { try{return new Intl.DisplayNames([locale],{type:'language'}).of(code)||code;}catch{return code;} }
export const english = {
  language:'Language',login:'Log in',register:'Create account',account:'My account',logout:'Log out',
  email:'Email address',password:'Password',confirm:'Confirm password',fullName:'Full name',
  loginTitle:'Welcome back.',registerTitle:'Create your MLAM account.',customerAccount:'CUSTOMER ACCOUNT',
  loginIntro:'Log in to your customer account. Administration uses a separate owner login.',
  registerIntro:'Create an account for MLAM products. Email delivery and payments are not live yet.',
  passwordHelp:'Use at least 15 characters. Do not reuse your email or banking password.',
  verificationNotice:'Email verification is not connected yet. Unverified accounts cannot access purchase records by email.',
  registerNotice:'If these details can be used, your account is ready to log in. Email verification is not available yet.',
  invalidCredentials:'Either email or password is incorrect',invalidDetails:'Check your details and use a password of at least 15 characters.',
  passwordMismatch:'The passwords do not match.',tooMany:'Too many attempts. Please wait before trying again.',connectionError:'Unable to connect. Please try again.',
  working:'Please wait…',back:'Back to MLAM Studio Pro',already:'Already have an account?',newCustomer:'New to MLAM?',
  accountTitle:'Your MLAM account.',signedIn:'Signed in as',emailPending:'Email verification pending',
  purchases:'Purchases and licenses',purchaseNotice:'Purchases will become available after email verification and payment integration are connected.',
  noPurchaseClaim:'Entering an email alone does not grant access to another customer’s purchases.',
  plugins:'Plugins',daw:'DAW',guides:'How to use',downloads:'Downloads',support:'Support',
  heroTop:'BUILT FOR REAL PRODUCERS',heroFirst:'Turn inspiration',heroSecond:'into',heroAccent:'sound.',
  heroCopy:'Original instruments and effects built by MLAM for fast ideas, expressive performance and professional mixes.',
  explore:'Explore plugins',seeVoice:'See Voice MIDI',tools:'Tools with a pulse.',all:'All',buy:'Buy full version',notify:'Notify me',
  tryDemo:'Try',demoSoon:'Demo coming soon',details:'View details',licensedDownload:'Download with license',comingSoon:'Coming soon',available:'Available',
  translationScope:'Navigation, account forms and original catalog descriptions follow your language. New product descriptions use translations provided by the owner; videos keep their original language.'
};
export const swahili:typeof english = {
  language:'Lugha',login:'Ingia',register:'Fungua akaunti',account:'Akaunti yangu',logout:'Toka',
  email:'Barua pepe',password:'Nenosiri',confirm:'Thibitisha nenosiri',fullName:'Jina kamili',
  loginTitle:'Karibu tena.',registerTitle:'Fungua akaunti yako ya MLAM.',customerAccount:'AKAUNTI YA MTEJA',
  loginIntro:'Ingia kwenye akaunti yako ya mteja. Administration ina login tofauti ya mmiliki.',
  registerIntro:'Fungua akaunti kwa bidhaa za MLAM. Utumaji wa email na malipo bado havijaunganishwa.',
  passwordHelp:'Tumia angalau herufi 15. Usirudie nenosiri la email au benki yako.',
  verificationNotice:'Uthibitishaji wa email bado haujaunganishwa. Akaunti isiyothibitishwa haiwezi kuona purchases kwa email.',
  registerNotice:'Ikiwa taarifa hizi zinaweza kutumika, akaunti iko tayari kuingia. Uthibitishaji wa email bado haujaunganishwa.',
  invalidCredentials:'Email au nenosiri si sahihi',invalidDetails:'Kagua taarifa zako na tumia nenosiri lenye angalau herufi 15.',
  passwordMismatch:'Manenosiri hayalingani.',tooMany:'Majaribio ni mengi. Tafadhali subiri kabla ya kujaribu tena.',connectionError:'Imeshindwa kuunganisha. Tafadhali jaribu tena.',
  working:'Tafadhali subiri…',back:'Rudi MLAM Studio Pro',already:'Tayari una akaunti?',newCustomer:'Wewe ni mteja mpya?',
  accountTitle:'Akaunti yako ya MLAM.',signedIn:'Umeingia kama',emailPending:'Email inasubiri kuthibitishwa',
  purchases:'Purchases na licenses',purchaseNotice:'Purchases zitaonekana baada ya kuunganisha uthibitishaji wa email na huduma ya malipo.',
  noPurchaseClaim:'Kuandika email pekee hakukupi ruhusa ya kuona purchases za mteja mwingine.',
  plugins:'Plugins',daw:'DAW',guides:'Jinsi ya kutumia',downloads:'Pakua',support:'Msaada',
  heroTop:'KWA WATENGENEZAJI WA MUZIKI',heroFirst:'Geuza ubunifu',heroSecond:'kuwa',heroAccent:'sauti.',
  heroCopy:'Instruments na effects za MLAM kwa mawazo ya haraka, uchezaji wenye hisia na mixes za kitaalamu.',
  explore:'Tazama plugins',seeVoice:'Tazama Voice MIDI',tools:'Vifaa vya ubunifu wako.',all:'Zote',buy:'Nunua toleo kamili',notify:'Nijulishe',
  tryDemo:'Jaribu',demoSoon:'Demo inakuja',details:'Tazama maelezo',licensedDownload:'Pakua kwa license',comingSoon:'Inakuja hivi karibuni',available:'Inapatikana',
  translationScope:'Navigation, fomu za akaunti na maelezo ya bidhaa zilizopo yanafuata lugha yako. Bidhaa mpya hutumia tafsiri zilizowekwa na mmiliki; video hubaki katika lugha yake ya awali.'
};
export type TranslationKey=keyof typeof english;
export type Dictionary=typeof english;
export const dictionaries:Record<InterfaceLanguage,Dictionary>={en:english,sw:swahili,...international};
export function dictionaryFor(value:unknown):Dictionary { return dictionaries[validLanguage(value)]; }
