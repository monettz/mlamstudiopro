# Supabase — akaunti za wateja na Admin ya MLAM Studio Pro

Wateja na Admin sasa hutumia Supabase Auth yenye cookies tofauti. Admin inaruhusiwa kwa email moja tu iliyoainishwa kwenye server kupitia `MLAM_ADMIN_EMAIL`; hakuna signup ya Admin ya umma. Mabadiliko haya ni uthibitishaji wa akaunti pekee—hayahamishi database ya bidhaa, picha, video, ZIP au malipo. Website haijachapishwa mtandaoni kwa mabadiliko haya pekee.

## Hali ya muunganisho wa kompyutani — 13 Oktoba 2026

- Mradi halisi: **MLAM Studio Pro** (`iwwnflrmbdzkorcgqmhj`), kwenye shirika lililochaguliwa na mmiliki.
- `.env.local` iliyopuuzwa na Git ina Project URL na **publishable key pekee**, pamoja na `MLAM_ORIGIN=http://127.0.0.1:4180`. Hakuna database password, service-role key au Google client secret.
- `MLAM_ADMIN_EMAIL` bado inahitaji kuwekwa kuwa email iliyothibitishwa ya Supabase itakayosimamia website. Kwenye kompyuta hii, double-click `ADMIN-SETUP.cmd`; itaomba email pekee, kuiandika kwenye `.env.local`, kisha restart website. Kwenye hosting, ongeza variable hiyo kwenye private environment settings.
- Supabase Site URL imehifadhiwa kuwa `http://127.0.0.1:4180`. Redirect URLs zilizohifadhiwa ni `http://127.0.0.1:4180/auth/callback` na `http://127.0.0.1:4180/auth/confirm` pekee; hakuna wildcard au domain nyingine.
- Provider settings zimehakikiwa: email signup imewashwa na email confirmation inahitajika. Google provider bado haijawashwa. Default SMTP si huduma ya kutuma email kwa wateja wote; custom SMTP bado inahitajika kabla ya signup ya umma.
- Muunganisho wa Supabase na fomu ya signup vimerudisha HTTP 200, na sehemu za kuandika zimewashwa. Automated tests 37 zimepita kwenye test provider tofauti; hakuna akaunti halisi ya mteja iliyoundwa na vipimo hivyo. Uthibitishaji wa live signup → email → login bado unahitaji mmiliki kujaribu kwa credentials zake mwenyewe.
- Production domain, custom SMTP, Google OAuth, malipo na migration ya data si sehemu iliyokamilishwa na muunganisho huu.

## Hatua zinazohitajika

1. Unda au chagua mradi **MLAM Studio Pro** kwenye Supabase. Unaweza kuanza kwenye Free plan; usichague upgrade ya kulipia bila kukusudia.
2. Katika Project Settings → API, pata **Project URL** na **publishable key**. Ziweke kwenye `.env.local` au environment ya hosting kama `SUPABASE_URL` na `SUPABASE_PUBLISHABLE_KEY`. Usitumie `service_role`, `sb_secret_...` au database password. `.env.local` haiwekwi Git. Restart website baada ya kubadili mazingira.
3. `MLAM_ORIGIN` iwe origin halisi ya website, mfano `http://127.0.0.1:4180` kwa kompyuta hii; production iwe HTTPS. Katika Supabase Authentication → URL Configuration, weka Site URL hiyo na ruhusu callback halisi `/auth/callback`. Ruhusu pia `/auth/confirm` ukitumia template iliyo hapa chini. Tumia origins/callbacks maalumu; usitumie wildcard ya production.
4. Authentication → Providers → Email: washa Email na **Confirm email**. Usizime uthibitishaji ili kukwepa tatizo la email. Kwa wateja halisi, sanidi custom SMTP; huduma ya email ya majaribio ya Supabase ina mipaka na haiwezi kuchukuliwa kuwa huduma kamili ya kutuma email kwa kila mteja.
5. Authentication → Providers → Google: weka Google OAuth **Web client ID na secret** kutoka Google Cloud. Secret iwe kwenye Supabase, si source code/frontend. Kwenye Google weka authorized JavaScript origin ya website; authorized redirect URI itoke kwenye Supabase provider settings (`https://PROJECT_REF.supabase.co/auth/v1/callback`). Hii si callback ya website. Scopes ni `openid email profile`; hatuombi kusoma Gmail inbox. Google consent/app publishing na usanidi huu vinahitaji mmiliki wa akaunti.
6. Weka `MLAM_ADMIN_EMAIL` kuwa email iliyothibitishwa inayotumika kuingia Supabase. Mmiliki awe na Supabase email/password account iliyothibitishwa. Admin login ni `/admin/login`; baada ya login, `/admin` inafungua dashboard. Akaunti nyingine za wateja haziwezi kuingia Admin hata zikijaribu metadata ya `role=admin`. Hakuna nenosiri linalowekwa kwenye website setup.
7. Jaribu mwenyewe email/nenosiri la mteja: signup → email ya uthibitishaji → confirm → login → logout. Jaribu Admin kwa email iliyo allowlist pekee na hakikisha logout ya Admin haiingilii session ya mteja. Jaribu Google kwa akaunti yako mwenyewe. Usitumie credentials halisi kwenye automated tests.

## Email ya uthibitishaji kwenye simu tofauti

Default PKCE email flow hutumia browser iliyoanza signup. Ili email ifunguke pia kwenye kifaa kingine, Supabase Authentication → Email Templates → Confirm signup inaweza kutumia:

Kwa mradi mpya wa Free plan, Supabase hairuhusu kubadili auth email templates ukiwa unatumia default SMTP. Sanidi custom SMTP kwanza, kisha tumia template hii. Usiahidi cross-device confirmation kwenye default template kabla ya kujaribu flow yake halisi. Hii ni [restriction rasmi ya Free plan](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier), si tatizo la fomu ya MLAM. SMTP provider ni usanidi tofauti; hakuna huduma ya kulipia iliyoanzishwa hapa.

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your MLAM account</a>
```

`/auth/confirm` inathibitisha token na Supabase, haiamini email au user ID iliyotumwa na browser. Usinakili token za wateja kwenye logs/support chat. Callback URLs zina `Referrer-Policy: no-referrer`, huondoa code/token kwenye URL ya mwisho na hazicachi session.

## Kabla ya kuuza

- Jaribu live provider configuration; local provider tests hazithibitishi Google/SMTP ya production.
- Badili `MLAM_ORIGIN` na URL allow-list baada ya domain kuwa tayari. Usitumie local `127.0.0.1` kama URL ya wateja mtandaoni.
- Tumia HTTPS, rate limits za reverse proxy, trusted-IP configuration sahihi, monitoring na backups. Counters za website ziko SQLite; hosts nyingi zitalazimika kutumia shared limiter badala ya copies tofauti.
- Logout huondoa cookies za browser hii na kubatilisha refresh session yake. Supabase access JWT iliyoibiwa inaweza kubaki halali hadi expiry yake; hii si ahadi ya kubatilisha kila token papo hapo. Owner Admin na mteja hutumia cookies tofauti.
- Akaunti za zamani hazijahamishwa kiotomatiki. Hifadhi data; migration inahitaji njia salama ya verification/reset na kuunganisha purchases. Usipe ruhusa kwa kulinganisha email pekee.
- Authentication si mfumo wa malipo/licensing. M-Pesa/cards na account-linked purchases bado ni hatua tofauti.

Vyanzo rasmi: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Email/password](https://supabase.com/docs/guides/auth/passwords), [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
