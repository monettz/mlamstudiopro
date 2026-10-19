# Mwongozo wa Ku-Host MLAM Studio Pro Kwenye Vercel (Vercel Deployment Guide)

Huu hapa mwongozo wa hatua kwa hatua wa jinsi ya ku-deploy tovuti ya **MLAM Studio Pro** kwenye **Vercel**.

---

## 1. Hatua ya Kwanza: Kupandisha Code Kwenye GitHub

Ikiwa mradi huu bado haujapandishwa kwenye GitHub:
1. Fungua [github.com](https://github.com) kisha tengeneza repository mpya (Private au Public).
2. Kwenye terminal ya kompyuta yako (au VS Code), endesha amri hizi kupandisha mradi:
   ```bash
   git init
   git add .
   git commit -m "MLAM Studio Pro: Tayari kwa Vercel Deployment"
   git branch -M main
   git remote add origin https://github.com/JINA-LAKO/REPO-YAKO.git
   git push -u origin main
   ```

---

## 2. Hatua ya Pili: Kuunganisha na Vercel

1. Ingia kwenye akaunti yako ya [Vercel](https://vercel.com).
2. Bonyeza **"Add New..."** -> **"Project"**.
3. Chagua repository yako ya GitHub uliyoipandisha (`Import`).
4. Kwenye **Configure Project**:
   - **Framework Preset**: Itatambua `Next.js` moja kwa moja.
   - **Build Command**: `next build --webpack` (tayari imesanidiwa kwenye `vercel.json`).

---

## 3. Hatua ya Tatu: Kuweka Environment Variables Kwenye Vercel

Chini ya ukurasa wa ku-deploy, fungua sehemu ya **Environment Variables** kisha weka variables zifuatazo:

| Variable | Thamani (Value) | Maelezo |
|---|---|---|
| `MLAM_ORIGIN` | `https://jina-la-project-yako.vercel.app` | URL yako ya Vercel (au custom domain yako) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | URL ya project yako ya Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOi...` | Supabase anon/publishable key |
| `MLAM_ADMIN_EMAIL` | `melaninentertainment255@gmail.com` | Email ya Admin wa studio |
| `MLAM_TRUST_PROXY_IP` | `1` | Inaruhusu Vercel Edge proxy headers |

> **Zingatia:** Kamwe usiweke Supabase `service_role` au secret keys kwenye frontend.

---

## 4. Hatua ya Nne: Bonyeza "Deploy"

1. Bonyeza kitufe cha **Deploy**.
2. Vercel itajenga mradi wako kwa takriban dakika 1 hadi 2.
3. Ukikamilika, utapewa URL ya bure ya `.vercelapp.com` (mfano: `https://mlam-studio.vercel.app`).

---

## 5. Hatua ya Tano: Kusasisha Supabase Auth URL

Baada ya kupata URL yako ya Vercel:
1. Ingia kwenye dashboard yako ya [Supabase](https://supabase.com).
2. Nenda **Authentication** -> **URL Configuration**.
3. Badilisha **Site URL** iwe ile ya Vercel (mfano: `https://mlam-studio.vercel.app`).
4. Kwenye **Redirect URLs**, ongeza:
   - `https://mlam-studio.vercel.app/auth/callback`
   - `https://mlam-studio.vercel.app/auth/confirm`
5. Bonyeza **Save**.

---

## Faili Zilizoongezwa/Kurekebishwa Kwenye Mradi:
- [`vercel.json`](file:///d:/MLAM%20STUDIO/vercel.json): Sanidi ya mchakato wa ujenzi wa Next.js kwenye Vercel (`--webpack`).
- [`.vercelignore`](file:///d:/MLAM%20STUDIO/.vercelignore): Huzuia kupakia faili za majaribio, `.git`, na scripts za ndani zisizohitajika.
- [`package.json`](file:///d:/MLAM%20STUDIO/package.json): Node engine imebadilishwa kuwa `>=22.0.0` inayokubaliwa na Vercel Node runtime.
- [`lib/node-runtime.mjs`](file:///d:/MLAM%20STUDIO/lib/node-runtime.mjs): Imeboreshwa kusaidia serverless environment ya Vercel (`/tmp/mlam-data` fallback na auto-copy ya database).
