# MLAM Studio Pro — one independent website

Local, unified successor to the two separate Sites projects. This folder is **not deployed** and is not tied to a Sites project ID. The original `MLAM_DAW_SITE` and `MLAM_PLUGIN_SITE` checkouts and hosted sites have not been deleted or modified by this consolidation.

## One origin

- `/` and `/plugins`: green MLAM Studio Pro storefront, actual product artwork, rotating 360° Y-axis 3D logo, plugin prices/details/demo links, and DAW coming soon.
- `/tutorials`: uploaded How to use videos, with seeking/range streaming.
- `/downloads`: licensed ZIP downloads.
- `/checkout?product=...`: same-site purchase destination. **Payments are deliberately disabled until a real merchant provider is integrated.**
- `/admin`: **MLAM Studio Pro Administration**. Manage products, upload images, demo/full ZIPs and videos, view orders and issue/revoke download licenses.
- `/admin/login`: owner-only Supabase email/password sign-in. The server allowlists one confirmed owner email through `MLAM_ADMIN_EMAIL`; admin/customer sessions use separate HttpOnly cookies.
- Owner Administration is reached directly at `/admin`; the public storefront and customer-account screens do not show an Admin link. This is presentation only, not the authorization boundary: owner login and API guards remain mandatory. `/admin?section=products`, `releases`, or `videos` keeps the selected upload section through login. Unknown section values cannot become external redirects. Mobile Administration keeps visible text labels and sign-out instead of icon-only controls.

## Run locally

Node.js 24+ required (built-in `node:sqlite`). Reproducible installation: `pnpm install --frozen-lockfile` using the included lockfile. The development machine uses local dependency junctions plus an isolated Supabase dependency runtime to avoid duplicating large packages on a nearly-full drive. Do not ship `node_modules`, `node_modules-shared` or `.local-auth-runtime`; install from `package.json` on the host.

```sh
npm run db:migrate
npm run dev
```

Open `http://127.0.0.1:4180/`; Admin is `http://127.0.0.1:4180/admin` on **the same origin**.
Responsive layouts cover storefront, account/checkout forms, tutorial videos, product dialogs and Administration. Fluid grids and wrapping controls fit narrow phones, tablets and desktop widths without hiding page overflow. The device-width viewport does not restrict browser zoom; touch controls have 44px targets and mobile form fonts are 16px.
Customer login/signup use a compact, light account card inspired by the owner's supplied reference: Log in/Create account navigation, email/password first, Google below, an accessible show/hide-password control, and MLAM green accents. Customer setup notices do not expose internal Supabase instructions. The signed-in customer page separates account details, verification status, purchases and useful download/tutorial links without inventing orders or license counts. Styling is scoped to customer pages; owner Administration and backend authentication are unchanged.

Admin uses the same Supabase project as customer authentication but remains owner-only: the confirmed Supabase account must match the server-only `MLAM_ADMIN_EMAIL` allowlist. There is no public Admin registration, customer metadata cannot grant Admin, and the role is checked server-side on every protected request. To set the local allowlist privately, double-click `ADMIN-SETUP.cmd` or run `npm run admin:setup`; this asks only for the confirmed Supabase email (never the password), writes `MLAM_ADMIN_EMAIL` to `.env.local`, and requires restarting the local server. On a hosted server, set that variable in the host's private environment instead. Customers and Admin keep separate Supabase cookies.

Supabase issues and refreshes the Admin session in an HttpOnly, SameSite=Lax cookie (Secure on HTTPS); each request verifies the user with Supabase and checks the allowlisted email. Admin login is limited to 5 attempts per normalized email per 15 minutes and 30 requests per source per 15 minutes. Explicit same-origin checks apply to every mutating API request. Do not expose port 4180 directly to the internet.

### Database-backed rate limits

- Admin login: at most **5 attempts per account per 15 minutes**; a successful login resets that account's attempt budget. This is a temporary cooldown, not permanent account lockout.
- Login request source: **30 requests per 15 minutes**, counted before parsing, including malformed input. Success does not reset this source budget.
- Protected Admin API routes: **120 admitted requests per authenticated account per minute**, shared across endpoints and sessions. Public product/video reads are not included in this authenticated budget.
- A single atomic SQL statement admits each request. Counters persist across restart in `auth_throttle`. Keys contain scoped SHA-256 digests instead of raw user identifiers or addresses. Blocked retries do not keep extending cooldowns. HTTP 429 includes `Retry-After` and `Cache-Control: no-store`.
- Invalid/missing/malformed/oversized credentials give the generic message **"Either email or password is incorrect"**. Admin and customer sign-in use separate email/password quota scopes; Admin is further restricted to the configured owner email. This is not a claim that every future endpoint is already protected.
- Login bodies are limited to 4 KB of actual streamed bytes. Owner and customer passwords are handled by Supabase and are not saved locally. Store database and uploads remain server-only, outside `public/`; SQL values are parameter-bound.
- Client IP headers are **not trusted by default**. Without trusted-proxy configuration, anonymous requests use a shared conservative source budget. Before production enable `MLAM_TRUST_PROXY_IP=1` ONLY when your sole reverse proxy strips and overwrites `X-MLAM-Client-IP` with its actual TCP peer address and direct access to Node is blocked. Never blindly trust `X-Forwarded-For` supplied by visitors.

These measures reduce brute-force/enumeration risks, not guarantee immunity. A targeted attacker may still cause temporary account cooldowns. Production also requires proxy-level request limits, HTTPS, updates/backups and a security review; MFA for the owner is a recommended next layer.

## Data and uploads

`MLAM_DATA_DIR` defaults to `./data`. This persistent folder contains `mlam.sqlite` and `uploads/` outside `public/`. Licensed releases are not served as static assets. Public image/video routes are scoped to their own file prefixes. Migrations run at Node server startup; `db:migrate` also applies them explicitly. The first catalog visit seeds only demo product metadata, not actual ZIPs or orders.

**Existing hosted data has NOT been migrated.** Before cutting over, export and back up the old products, orders, licenses, tutorials, ZIPs and R2 objects using authenticated owner access. Import them into this database/storage preserving IDs, filenames and keys, then compare counts and test licensed downloads. Do not point to a new database and claim old purchases have transferred. Keep the old sites online until cutover is verified.

## Next week's deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md). The prepared route is one Render Node web service with a persistent disk for both the frontend/backend process and current SQLite/file storage. `render.yaml` configures a paid service and disk, but no account, domain, or billable resource has been created or purchased. Review the current price before applying the Blueprint. Cloudflare R2 is not connected to the current storage code.

## Not finished / release gates

Checkout now displays full name, email and preferred payment method. `POST /api/checkout/prepare` validates bounded input with database-backed quotas: 20 submissions per source and 5 per normalized email per 15 minutes. The same trusted-proxy requirements as login apply; without that configuration, source quotas are conservatively shared. Email entry is not signup, verified identity or account login. For valid input the server deliberately returns HTTP 503 `PAYMENT_NOT_CONFIGURED`: no contact data, order, charge or license is saved. Only scoped rate-limit digests are stored. HTTP 429 includes `Retry-After`; the form displays the cooldown and prevents duplicate clicks. Limits are enforced by the backend even if the browser form is bypassed.

- Customer signup/login/logout now use **Supabase Auth**, with Google/Gmail and email/password at `/account/register` and `/account/login`. Each server request uses a fresh `@supabase/ssr` client; sessions are in HttpOnly, SameSite=Lax cookies (Secure on HTTPS), with server-verified `getUser()` identity. Proxy refresh preserves cookie chunks and no-cache headers. Only a publishable/anon key is accepted. No service-role key, access token or password is returned to browser JavaScript. Google uses PKCE and minimal `openid email profile` scopes, not Gmail inbox access. `/auth/callback` exchanges a code using the original verifier cookie and restricts return paths to customer destinations on the configured origin. `/auth/confirm` supports confirmation-email token hashes for cross-device confirmation. Auth pages/callbacks are private/no-store.
- **Live auth needs a Supabase project and provider setup**; see [SUPABASE-SETUP.md](./SUPABASE-SETUP.md). Until configured, forms show a setup notice and APIs return 503 `AUTH_NOT_CONFIGURED`, not a pretend account. Enable email confirmation and configure SMTP for real customer delivery. Google also needs Google Cloud OAuth credentials in Supabase. Tests use only a local test provider, never real credentials.
- Login limits remain 5 attempts/normalized email/15 minutes and 30 requests/source/15 minutes. Signup remains 3 submissions/email/hour and 10 requests/source/hour; accepted/duplicate signup notices are generic and never overwrite credentials. Google initiation has 20 requests/source/15 minutes. Supabase's provider quotas are an additional layer. No customer identity or editable `role` metadata grants owner access; only the confirmed `MLAM_ADMIN_EMAIL` allowlist does. Admin and customer sessions use separate cookies. Legacy customer tables/data are preserved but legacy cookies are no longer accepted by website routes. Do not silently import old customer passwords into Supabase or link purchases solely by email.
- Password recovery, account-linked purchases/downloads and comments/moderation still need implementation. The existing bearer-license ZIP download route remains unchanged; it is not yet bound to verified customer accounts. This auth change does not enable payments or migrate the catalog/uploads/orders database to Supabase.
- One site-wide Language selector offers 12 implemented interface languages with one native label each: English (first/default), Kiswahili, French, Spanish, German, Portuguese, Italian, Arabic, Simplified Chinese, Japanese, Hindi and Russian. Navigation, main controls, account forms, notices and the six original catalog descriptions have complete local dictionaries. Cards, View details and product spotlights share the same description component and switch instantly. Arabic uses RTL layout; email/password fields and untranslated Administration use LTR. Product names, prices and artwork are never translated or changed. New products accept owner-provided description translations in Admin → Products; existing products have Edit descriptions. Original owner copy is preserved; changed originals never silently use stale built-in translations. Missing translations show English with a localized notice. Technical feature names, videos, Admin and parts of checkout keep their original language. Only an explicit validated user choice is remembered in a non-secret preference cookie. No remote translation service or sensitive page content is sent anywhere. This is not every language on Earth.
- M-Pesa / Visa / Mastercard require a verified merchant provider, secret credentials and authenticated payment webhooks. Only a verified successful payment may issue a purchase license. No "paid" events or sample customer orders are fabricated.
- Existing Orders is a real database view, but no payment provider currently writes successful purchases.
- ZIP download licenses **are not in-plugin activation**. Signed device-bound activation is a separate next phase, after the standalone plugin build is ready.
- Real owner media/demo ZIPs must be uploaded by the owner. Imager artwork is a source-derived interface preview; the standalone product is coming soon.
- Run a security/dependency review before public sales, configure backups, and verify all release gates. This is a working consolidation, not a finished payment/activation system.

Reference: [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting), [Node SQLite](https://nodejs.org/api/sqlite.html), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Append-only migration `0004_customer_accounts.sql` added legacy customers and customer sessions; the Supabase switch preserves those tables without treating them as the current auth source. No existing owner/products/purchases tables are replaced. Language selection never changes product prices or currencies. Real payments and live provider configuration remain release gates.
Append-only migration `0005_product_description_languages.sql` adds a `description_translations` JSON text column only. Original descriptions, uploads, product IDs, prices and statuses are unchanged. Description writes require owner authorization, use bounded input, reject unsupported language codes and limit each translation to 4000 characters. Public `/api/products?language=fr` returns the requested copy plus all available descriptions; the original owner data is retained for editing.
