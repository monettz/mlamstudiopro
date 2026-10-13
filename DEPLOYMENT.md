# Single-domain deployment checklist

No account purchase, domain registration, remote server write, payment capture or DNS change has happened.

## Prepared hosting route: Render + your domain

This project now has a Render Blueprint (`render.yaml`) and a start command that keeps local use on `127.0.0.1:4180` but binds to Render's public port when deployed. Render will host both the frontend and backend in one Node service.

The Blueprint specifies a paid Starter service and a 10 GB persistent disk. **The local config file does not create anything or charge you.** Applying it in Render starts billable resources, so review and approve the current price there before confirming. A free instance cannot attach the disk this app needs.

The disk stores the SQLite database and uploaded ZIPs, images and tutorials under `/var/data/mlam`. It is a finite 10 GB starting space, not unlimited storage. Cloudflare R2 is not connected to this app yet; switching to it requires implementing and testing a storage adapter and migrating files.

1. This folder is not connected to a Git repository yet. Create a private GitHub repository and upload the project without `.env.local`, `.env`, `data/`, `node_modules/` or `.next/`.
2. In Render, create a Blueprint from that repository and review the paid service and persistent disk before applying it. Render will provide a temporary public `onrender.com` address. Customers see your website and its address—not the hosting dashboard.
3. In Render's private environment settings, set `MLAM_ORIGIN` to that exact HTTPS address, and enter the real Supabase project URL, publishable key, and `MLAM_ADMIN_EMAIL`. **Never add a Supabase secret/service-role key.**
4. Add that production address and its `/auth/callback` (and `/auth/confirm` when used) to Supabase Auth → URL Configuration. The currently saved `127.0.0.1:4180` address is only for this computer and will not authenticate production customers.
5. Test customer login, owner Admin login, image/video uploads, ZIP upload/download and persistence after redeploy. Set up backups before adding real products. A custom domain can be connected later; it is not required for this first test.
6. Finish the payment-provider integration and release gates in `README.md` before advertising paid purchases. The current checkout does not yet process live payments.

The prepared service region is Frankfurt. Select another supported region in Render if your data-residency needs require it. Keep one service instance while SQLite and uploads use a single persistent disk.

## Runtime and security settings

- Set `MLAM_DATA_DIR` to an absolute persistent directory. **Never serve it as static web content.**
- Keep `MLAM_TRUST_PROXY_IP=0` until trusted client-IP forwarding has been confirmed for the chosen platform and the app's explicit proxy trust is configured. Email-based limits still apply; source-based limits are shared while proxy IP trust is disabled.
- Set `MLAM_ORIGIN` to the exact public HTTPS origin. Do not use `127.0.0.1` for production users.
- Configure Supabase authentication following `SUPABASE-SETUP.md`: publishable key and project URL, actual HTTPS Site URL and callback allow-list, email confirmation/SMTP and Google provider credentials. Never expose service-role or Google client secrets in the app's frontend. Auth routes and refresh responses must bypass CDN/reverse-proxy caching.
- Set the server-only `MLAM_ADMIN_EMAIL` to the same confirmed Supabase email you control. Only that email can open Administration; public Admin signup is disabled and customer metadata cannot grant access.
- Check the database-backed limits: 5 login attempts/normalized email/15 minutes, 30 login requests/source/15 minutes, and 120 protected Admin API requests/account/minute. HTTP 429 includes a positive `Retry-After`. Verify cooldown persistence after restart and ensure wrong credentials do not reveal account existence.
- After choosing a domain, connect it to Render, set one canonical origin, and test the same-origin write guard with that exact domain.

## Safe cutover

- Restore authenticated owner access to the old websites before exporting records/files; local source does not contain their production data.
- Back up old database and uploads, import and compare exact records/object counts, confirm active releases and customer licenses, and exercise video seeking and download failures/success.
- Verify the owner login, session expiration/logout, denied anonymous API writes, draft visibility, product/media uploads, customer signup and comments when implemented, and payment webhooks in provider sandbox.
- Do not enable live Buy until merchant integration, authenticated successful-payment verification, refunds/duplicate-event handling, and license fulfillment pass tests.
- Keep old sites/data available for rollback. Disable or redirect old public URLs only after the single-domain site and migrated data are verified.

## Backups

Back up the SQLite database with a consistent SQLite backup operation, plus all uploads and their `.metadata.json` files. Copying only `mlam.sqlite` while WAL writes run can lose recent data. Test restore. Keep the persistent disk attached: this layout is not suitable for ephemeral serverless filesystems or multiple independent app replicas without a shared database/storage redesign.

## Still required

Supabase customer and Admin auth code is implemented but still requires the real project, private `MLAM_ADMIN_EMAIL` configuration, live provider configuration and owner testing. Password recovery, account-linked purchases, comments moderation, payment processing and in-plugin device activation are separate unfinished features listed in README. No claim of a production-ready commerce system is made.
