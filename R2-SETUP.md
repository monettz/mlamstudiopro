# Cloudflare R2 — kuhifadhi faili za MLAM Studio Pro

Website inahifadhi ZIP za plugins, demo, video za tutorials na picha za bidhaa. Bila R2, faili hizi zinakaa kwenye `MLAM_DATA_DIR/uploads` (kwa kawaida `data/uploads`) kwenye server yenyewe. Ukiweka R2, faili mpya zote zinakwenda kwenye bucket yako ya Cloudflare R2 badala yake. Database (SQLite) haihamishwi; R2 ni ya faili tu.

Customers hawapakui kutoka R2 moja kwa moja. Website inakagua license kwanza, kisha inatuma faili kutoka R2. Bucket ibaki **private**.

## Hatua

1. **Unda bucket.** Cloudflare dashboard → **R2 Object Storage** → **Create bucket**. Jina mfano `mlam-files`. Usiwashe "Public access" wala custom domain kwa bucket hii.
2. **Pata Account ID.** Iko kwenye ukurasa wa R2 Overview (herufi 32). Hiyo ndiyo `R2_ACCOUNT_ID`.
3. **Unda API token.** R2 → **Manage R2 API Tokens** → **Create API token**:
   - Permission: **Object Read & Write**
   - Specify bucket: chagua bucket uliyounda tu (si zote)
   - Baada ya kuunda, nakili **Access Key ID** na **Secret Access Key**. Secret inaonyeshwa mara moja tu.
4. **Weka kwenye `.env.local`** (faili hili halipandi GitHub). Usiweke keys hizi kwenye code wala kwenye chat:
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=mlam-files
   ```
   Zote nne lazima ziwepo; ukiweka baadhi tu, website inakataa kupakia faili ili isihifadhi mahali pasipo sahihi kimyakimya.
5. **Hamisha faili zilizopo** kutoka `data/uploads` kwenda R2:
   ```
   npm run storage:sync-r2 -- --dry-run
   npm run storage:sync-r2
   ```
   Ya kwanza inaonyesha tu kitakachopakiwa; ya pili inapakia. Faili zilizopo tayari R2 (ukubwa uleule) zinarukwa.
6. **Anzisha upya website.** Kuanzia hapo uploads mpya za admin zinakwenda R2. Jaribu: pakia picha ya bidhaa kwenye admin, kisha fungua ukurasa wa bidhaa; cheza video ya tutorial; pakua ZIP kwa license key.

## Kwenye hosting

Weka variables hizo nne kwenye private environment settings za host (si kwenye repo). R2 inaondoa haja ya persistent disk kwa faili, lakini SQLite database bado inahitaji disk au huduma ya database.

## Kurudi kwenye storage ya ndani

Futa variables nne za `R2_*` na uanzishe upya. Faili zilizopakiwa R2 wakati huo hazinakiliwi kurudi `data/uploads` kiotomatiki.
