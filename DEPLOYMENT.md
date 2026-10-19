# LIV ESTETIK deployment notes

## cPanel static sites

The public website and staff dashboard are separate Vite applications. Build each from its own folder and upload the contents of its `dist/` folder to the document root for its domain:

- Public site: `liv_estetik-frontend/dist/` → the main domain document root.
- Staff dashboard: `liv_estetik-admin/dist/` → the staff/admin subdomain document root.

The admin build reads `VITE_API_BASE_URL` from `liv_estetik-admin/.env.production`, which points at the existing Render API. Keep that URL public; never put API secrets in either Vite app. The backend already has an allowlist for the main and admin domains; if the site uses a different hostname, update `CLIENT_ORIGIN` in the backend host settings.

Extract each `cpanel-upload.zip` directly into its document root so `index.html`, `assets/`, and public images sit at the root. Keep existing server configuration files such as `.htaccess` unless you have checked their contents.

## MongoDB additive backfill

Before deployment, back up the production database. New collections and indexes are created by Mongoose as their models are first used. To add normalized phone keys and label pre-existing bookings whose source was never captured, run this once from `liv_estetik-backend/` against the configured production database:

```sh
npm run migrate:reporting
```

The migration only adds fields; legacy booking source is marked `unknown` rather than inferred.

## Scheduled reports with cPanel cron

The backend does not keep a browser or in-process timer responsible for reports. cPanel can call the backend's authenticated cron endpoint every five minutes. Reports are only generated when an administrator has enabled the schedule in **Clinic Settings**. Periods use `Africa/Addis_Ababa`, and a unique schedule key prevents duplicate reports if cPanel retries a request.

1. Generate a private random secret of at least 32 characters.
2. Set `REPORT_CRON_SECRET` to that secret in the Render backend environment and restart the backend.
3. On cPanel, create a script outside `public_html`, readable only by the account owner. It should make this request over HTTPS, adding `Authorization: Bearer <same-secret>`:

   `POST https://liv-estetik-api.onrender.com/api/cron/reports/run`

4. Add a cPanel cron entry to run the private script every five minutes (`*/5 * * * *`).
5. Enable and configure daily, weekly, and monthly times under **Clinic Settings**. Times must be in five-minute increments and are Addis Ababa local time.

The endpoint never returns or logs the configured secret. If the API host is asleep or unavailable at the scheduled minute, a later five-minute invocation will generate the still-missing report for that local period.

## Report sharing

WhatsApp sharing opens a prefilled message for a staff member to review, choose the intended group, and send manually. The system records that the share link was opened for saved reports. It does not claim that WhatsApp accepted or delivered a message. PDF export uses the browser's print dialog; select **Save as PDF**.

## Backend environment

Existing production settings remain in the backend host's secret environment: `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and mail configuration as needed. Add `REPORT_CRON_SECRET` only when enabling cPanel scheduled reports. Do not copy backend `.env` files to cPanel public roots or frontend builds.
