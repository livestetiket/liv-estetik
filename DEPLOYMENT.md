# LIV ESTETIK deployment notes

## cPanel static sites

The public website and staff dashboard are separate Vite applications. Build each from its own folder and upload the contents of its `dist/` folder to the document root for its domain:

- Public site: `liv_estetik-frontend/dist/` → the main domain document root.
- Staff dashboard: `liv_estetik-admin/dist/` → the staff/admin subdomain document root.

The admin build reads `VITE_API_BASE_URL` from `liv_estetik-admin/.env.production`, which points at the existing Render API. Keep that URL public; never put API secrets in either Vite app. The backend already has an allowlist for the main and admin domains; if the site uses a different hostname, update `CLIENT_ORIGIN` in the backend host settings.

Extract each `cpanel-upload.zip` directly into its document root so `index.html`, `assets/`, and public images sit at the root. Keep existing server configuration files such as `.htaccess` unless you have checked their contents.

### Brand and hero images

- Put the clinic logo PNG at `liv_estetik-frontend/public/liv-estetik-logo.png` and copy the same file to `liv_estetik-admin/public/liv-estetik-logo.png`. Both files are used for the logo and favicon.
- To replace the home hero placeholder, put a photo at `liv_estetik-frontend/public/images/hero-clinic.jpg`. The site will use it automatically; until then, it shows a designed placeholder.
- Rebuild and re-upload the affected site's ZIP after adding or changing these files.

### Public API connection

The public site production build uses `VITE_API_URL=https://liv-estetik-api.onrender.com/api`. Keep the `/api` suffix. Local development defaults to the Vite `/api` proxy.

## MongoDB additive backfill

Before deployment, back up the production database. New collections and indexes are created by Mongoose as their models are first used. To add normalized phone keys and label pre-existing bookings whose source was never captured, run this once from `liv_estetik-backend/` against the configured production database:

```sh
npm run migrate:reporting
```

The migration only adds fields; legacy booking source is marked `unknown` rather than inferred.

Before deploying the patient registry and primary-account protection, back up the database and run the additive migrations from `liv_estetik-backend/` against the confirmed production database:

```sh
npm run migrate:patient-cards
npm run migrate:protect-primary-admin
```

The patient migration assigns cards only to records that do not already have one, normalizes existing contact fields, and reserves unique contact identities when possible. Conflicting legacy identities are preserved and reported; the migration does not merge or delete patients. The primary-admin migration marks the existing `ADMIN_EMAIL` account as protected. Confirm the configured email is the intended administrator before running it.

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

Report data is calculated from MongoDB records for the selected Addis Ababa date range. Patient details in report responses are limited by the `patients.view` permission, and file exports require `reports.export`. CSV files include formula-injection protection. Admin audit-log CSV export uses the currently selected audit filters.

## Booking email delivery

Email defaults to `EMAIL_PROVIDER=console`, which records a **simulated** attempt in the backend log and does not send to a recipient. Configure a real SMTP relay in the backend host's private environment settings to deliver messages:

- `EMAIL_PROVIDER=smtp`
- `EMAIL_FROM` (verified sender address, required for SMTP)
- `SMTP_HOST`
- `SMTP_PORT` (587 for STARTTLS or 465 for implicit TLS)
- `SMTP_USER` and `SMTP_PASS` when the relay requires authentication

The application records each attempt and its status. `sent` means accepted by the provider; `delivered` is used only when provider feedback exists. No SMTP credentials are bundled in the frontend or repository. `liv_estetik-backend/.env.example` documents local development values without real secrets.

## Clinic hours

Weekly hours, daily breaks, closed dates, and one-off special hours/holidays are managed under **Clinic Settings**. One-off dates take precedence over the weekly schedule and are returned by the public `GET /api/clinic-hours` endpoint. Existing generated time slots are not deleted by a settings change; the public availability API filters them against the current schedule.

## Backend environment

Existing production settings remain in the backend host's secret environment: `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and mail configuration when real delivery is needed. `EMAIL_PROVIDER=console` remains an explicit non-delivery simulation. Add `REPORT_CRON_SECRET` only when enabling cPanel scheduled reports. Do not copy backend `.env` files to cPanel public roots or frontend builds.

The Render API must use the MongoDB database that contains the clinic's services and staff accounts. Its startup log reports the connected database name. If it says `(test)` while the clinic data is stored in another database, update the database name in `MONGO_URI` before expecting those records to appear.

In production, `MONGO_URI` must include the database name as its path, for example `mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority`. Do not omit `/<database>`; MongoDB clients can otherwise connect to the default `test` database. Use the actual database containing the clinic's records, and keep the URI only in Render's secret environment settings.

If Render logs a MongoDB connection failure, check that the Atlas cluster is active, the database user credentials are correct (URL-encode special characters), and the Atlas project's **Network Access** list includes the outbound IP ranges shown on the Render API service under **Connect → Outbound**. Do not use an unrestricted `0.0.0.0/0` entry as a shortcut.

### One-time admin account setup or password reset

For a Render Free web service without Shell access, set a new `ADMIN_PASSWORD` (at least 16 characters) in the service's Environment settings. After the latest backend code is deployed, temporarily change the Start Command to `npm run bootstrap:admin && npm start`. Wait for `[admin-bootstrap] Configured admin account is ready.` in the logs, then immediately change the Start Command back to `npm start` and wait for that deploy. The command only creates or resets the configured admin account; it does not seed sample clinic content. Do not leave the temporary command configured, because it applies `ADMIN_PASSWORD` each time the service starts.
