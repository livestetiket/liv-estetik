# Liv Estetik System Training Guide

**Audience:** clinic administrators, reception staff, and technical support  
**System:** Liv Estetik public website, staff dashboard, Express API, and MongoDB  
**Clinic time zone:** Africa/Addis_Ababa (EAT, UTC+3)

This guide explains what the system currently does, how staff use it, how the main records relate to each other, and how to handle common problems. It describes the implementation in this repository. Some features depend on the production API and database being online.

---

## 1. The system at a glance

The system has three connected parts:

1. **Public website** (`liv_estetik-frontend`) — clinic information, treatment list, appointment requests, and contact form.
2. **Staff dashboard** (`liv_estetik-admin`) — login-protected workspace for administration and reception.
3. **Backend API** (`liv_estetik-backend`) — validates requests, applies business rules, stores records in MongoDB, and serves both websites.

The public website and dashboard are separate static web applications. They can be uploaded to separate cPanel document roots. The API is a separate Node.js service and connects to MongoDB. The current production configuration points the websites to the Render API; uploading the static ZIP files to cPanel does **not** move the API or database onto cPanel.

```text
Client browser
  ├── Main site (static React/Vite build)
  └── Staff dashboard (static React/Vite build)
            │ HTTPS requests
            ▼
       Express API (Node.js)
            │ Mongoose
            ▼
         MongoDB
```

If the API or database is unavailable, static pages may still load, but login, appointments, treatment data, messages, and dashboard reports may fail or show an error.

---

## 2. What clients see on the public website

The homepage is assembled in `liv_estetik-frontend/src/App.jsx`. It currently contains:

- **Navigation:** Home, About, Treatments, Results, Gallery, and Contact links.
- **Hero:** clinic introduction, consultation link, and a photo at `public/images/hero-clinic.jpg`.
- **Treatment list:** services fetched from the API. Active services link into booking with that service selected. Coming-soon or inactive treatments cannot be booked.
- **Clinic philosophy:** the care approach and service values.
- **Results and gallery:** image locations are configured in `src/siteContent.js` and the photography sections.
- **Booking form:** client details, treatment selection, appointment time, review, and submission.
- **Contact form:** sends a message record to the API.
- **Footer:** clinic information and social links.

The treatment list and appointment times are database-backed, not hard-coded into the page. A treatment must be visible to appear publicly, active to be bookable, and have valid appointment capacity and generated slots to offer times.

### Current image locations

Add or replace JPEG photos under `liv_estetik-frontend/public/images/`, then rebuild the public website. The current source references include:

| Purpose | Filename |
| --- | --- |
| Homepage hero | `hero-clinic.jpg` |
| Hair treatment/gallery | `hair-treatment.jpg` |
| Facial treatment | `facial-treatment.jpg` |
| Body treatment | `body-treatment.jpg` |
| Clinic/gallery | `clinic-gallery.jpg` |
| Team | `medical-team.jpg` |
| Before patient result | `patient-results-before.jpg` |
| After patient result | `patient-results-after.jpg` |

Patient photos must only be added when the clinic has permission to publish them. The website includes alt text indicating approved patient imagery. The logo and favicon are separate PNG assets copied into each app's `public` directory.

At the time this guide was written, `hero-clinic.jpg` and `hair-treatment.jpg` are present in the public image folder. The other image names in the table are source references and need to be supplied if those gallery/result areas are to show their intended photos.

---

## 3. Staff roles and access

All protected API actions require a signed-in account. The backend checks the active user's current role permissions on each request; hiding a dashboard menu item alone is not the security control. Admins can create database-backed custom roles and grant only the permissions those staff need.

| Dashboard area | Admin | Reception | Call Center Agent |
| --- | :---: | :---: | :---: |
| Overview | Yes | Yes | Yes |
| Bookings and patient registry | Yes | Yes | No |
| Call follow-ups | Yes | No | Assigned records |
| Daily visits | Yes | Yes | No |
| Client messages | Yes | Yes | No |
| Time slots | Yes | Yes | No |
| Testimonials | Yes | Yes | No |
| Role, staff, and service management | Yes | No | No |
| Email queue and retries | Yes | No | No |
| Audit logs | Yes | No | No |
| Reports | Yes | View permission | No by default |
| File exports | Yes | `reports.export` permission | No by default |
| Clinic hours, exceptions, report schedule | Yes | No | No |
| Personal email/password settings | Signed-in staff | Signed-in staff | Signed-in staff |

Custom roles can be assigned additional areas through Role Management. API access takes effect immediately when permissions are changed or a custom role is disabled.

### Admin responsibilities

- Maintain reception/admin user accounts and access.
- Keep services visible, active, correctly named, and correctly configured for duration and daily capacity.
- Review bookings, patient records, messages, calls, visits, failed email delivery, reports, and audit history.
- Set clinic operating hours, special dates, and closures.
- Configure report times and coordinate the cPanel cron trigger if scheduled reports are required.
- Ensure production secrets are stored in the backend host's private environment settings.

### Reception responsibilities

- Review booking requests and follow the clinic's approval process.
- Search patient records by card number, name, phone, or email before registering a new record.
- Keep testimonial records, messages, and follow-ups coordinated with the relevant call center agent.
- Record every clinic walk-in/visit with its date, card number (when available), name, phone, and service.
- Update client messages and coordinate appointment availability.
- Use the time-slot controls carefully when the schedule changes.

Reception cannot manage call activity, staff, roles, service configuration, or clinic settings. Reports require `reports.view`; exports additionally require `reports.export`. Admins can use reception workflows as well as administrative features.

---

## 4. Login and account security

1. Open the staff/admin subdomain.
2. Enter the clinic staff email address and password assigned to the account.
3. The dashboard checks the current session against the API before showing staff pages.
4. Use the account menu to change your own email or password.
5. Sign out when finished on a shared computer.

The API stores a bcrypt password hash, not a readable password. Inactive users cannot log in. Admins can create, edit, deactivate, delete, and reset other staff accounts. An admin cannot use the reset-user endpoint to reset their own password; they should use Account Settings.

Do not put staff passwords, JWT secrets, MongoDB URIs, mail passwords, or cron secrets in a public website folder, Git commit, ZIP upload, or training handout. This training file intentionally contains no credentials.

---

## 5. Booking workflow

### 5.1 Website appointment request

1. Client opens **Treatments** and selects an available treatment, or starts from the booking section.
2. Client enters full name, phone, and optional email/notes.
3. Client selects one treatment. One booking record represents one service.
4. The site asks the API for available times over the next 14 days for that service.
5. Client selects a time and reviews the request.
6. On submit, the API rechecks that the service is active and the slot is selectable. It does not trust the browser alone.
7. The API finds or creates the customer record, creates a `pending` booking, reserves the requested slot, and records the initial status history.
8. Staff see the saved request in the dashboard's Bookings view.

The public submission is a **request**, not a promise that the appointment is confirmed. Staff should contact the client and approve or reschedule it according to clinic policy.

### 5.2 Reception-entered booking

Reception can select **New booking** in Bookings, enter the client and source, choose a service and available time, and submit. The form can search for an existing client by phone. If a matching record is found, the API links the new booking to that customer record.

Booking source identifies where the request came from, such as phone, WhatsApp, TikTok, Instagram, Facebook, walk-in, referral, or other. Website requests are recorded with source `website`.

### 5.3 Booking statuses

The stored booking can have these statuses:

| Status | Meaning / training guidance |
| --- | --- |
| `pending` | New request waiting for staff review. |
| `approved` | Staff accepted the requested time. The approved time is saved separately. |
| `arrived` | Client has checked in. |
| `in_progress` | Appointment/treatment is underway. |
| `reschedule_requested` | A reschedule is awaiting handling when this status is used. |
| `rescheduled` | Staff set and saved another appointment time. |
| `completed` | Appointment is finished. |
| `rejected` | Staff declined the request. Record a clear reason. |
| `cancelled` | Appointment was cancelled. Record the reason where possible. |
| `no_show` | Historical status retained for old records. No Show controls and new no-show transitions are not available in the dashboard/API. |

Allowed status transitions are enforced by the API. For example, a pending appointment cannot be marked completed directly; approved or rescheduled appointments can be checked in, started, or completed. Each transition is written to booking status history. Do not create a second booking just to change the date of an existing appointment; use the reschedule workflow.

### 5.4 Booking actions and records

- **Approve:** stores the requested slot as the approved slot and records the approver/time.
- **Reject:** records a reason, changes status, releases the slot, and attempts a notification email if the booking has an email address.
- **Reschedule:** validates/reserves a new slot, updates the approved time, and releases the previous reservation when the operation succeeds.
- **Complete / arrived / in progress:** updates operational status and history.
- **Cancel:** saves the reason in internal notes, updates history, and releases the slot.
- **Internal note:** adds a staff-attributed note; it is not a customer-facing email.
- **Delete:** admin-only hard deletion. Prefer a status such as cancelled or rejected when an auditable record is appropriate.

The booking record stores a snapshot of the client's submitted name/contact and treatment name, plus references to the customer, service, and time slot. Status history records who changed status and when. Email delivery is a separate record and can fail even if the booking status change succeeded.

### 5.5 Hair transplant appointments

Appointment times are stored as UTC instants and interpreted using the clinic time zone, Africa/Addis_Ababa. The browser now uses the server's returned availability instead of applying a second, mismatched UTC-hours filter.

On backend startup, active services whose name contains “hair transplant” and whose daily maximum is zero or missing are set to a maximum of **one appointment per day**. The rolling slot generator then creates future availability. This repair only applies to active hair transplant service records; it does not change other treatments. It takes effect after the updated backend is deployed and starts.

If a hair transplant still has no times after deployment, an admin should check **Services**: the service must be active, not marked coming soon, have a duration that fits clinic opening hours, and have a positive daily maximum. Then check **Time Slots** and **Clinic Settings** for blocked dates or slots.

---

## 6. Treatment and appointment availability

An admin's Services page controls:

- **Name and category:** shown on the public site and related records.
- **Description:** public-facing treatment information.
- **Active:** whether it may be booked.
- **Visible:** whether it appears on the public treatment list.
- **Coming Soon:** visible promotion without normal booking availability.
- **Duration:** how long generated appointment slots last.
- **Max per day:** maximum generated appointment count for the service each calendar day.
- **Sort order:** presentation order.

The backend generates a rolling 14-day time-slot window after startup and refreshes it every five minutes. New services trigger an additional slot-generation pass. The generator follows clinic hours, configured breaks, service duration, capacity, existing slots, and blocked dates. A slot has a service, start/end, status, capacity, and booked count.

### When a client says there are no times

Check these in order:

1. Service is visible, active, and not coming soon.
2. `Max per day` is greater than zero.
3. Duration fits inside the clinic's configured operating window.
4. The day is open and not in Closed Dates.
5. The service's time slots exist and are `available`, not blocked or full.
6. The client selected the same service whose slots were generated.
7. The API is connected to the intended MongoDB database.

Reception and admins may create or block/unblock manual slots from Time Slots. Admins can also edit slot status or delete a slot. Check whether the slot is already tied to a pending or confirmed request before changing it.

---

## 7. Reception workflows

### 7.1 Call activity

Call Activity is available to Admins and Call Center Agents. Reception cannot open or call the API directly. It is a **manual log**, not connected to a phone carrier. Admins may assign a follow-up to an active Call Center Agent. Agents can see and update only records assigned to them. For each call, staff can record:

- Inbound or outbound direction.
- Phone, patient name, and patient card number when known.
- Related service and booking, when known.
- Outcome: booking created, consultation inquiry, follow-up, information provided, no answer, unsuccessful, or other.
- Status: pending, in progress, follow-up required, completed, or unable to reach.
- Whether follow-up is required and its date.
- Notes.

Use the follow-up filter to see calls needing attention. Mark a follow-up complete only when the clinic has completed it. The system records who logged and updated each call, and each update is audit logged.

### 7.2 Patient records and PRP courses

Reception can search the patient registry by name, phone, email, or patient card number. Search before registration; if a genuine matching record exists, select it for the booking. A new patient receives a sequential `LE-YYYY-000001` card number. Matching phone/email identity conflicts are blocked and must be resolved by selecting the correct saved record or correcting the contact details. Shared contact details can make a match ambiguous, so use the patient name and card number to confirm.

Open a patient profile to correct permitted details and review PRP treatment courses. Each course has six numbered sessions. Entering a date does not complete a session; an authorized staff member must explicitly check completion. The system retains who changed the session and the before/after status/date history.

### 7.3 Daily visits

Use **Daily Visits** to record each person who physically came to the clinic. Enter:

1. Date of visit (EAT/local clinic date).
2. Card number, if available.
3. Full name.
4. Phone number.
5. Service (choose an existing treatment or choose Other and type the service name).
6. Optional notes.

The saved record identifies the staff member who entered it. Visit records appear in the reception/admin visitor list and are included in report totals/details for the selected date range. Avoid duplicate entries; check Recent Visitors first if uncertain.

### 7.4 Contact messages

The public Contact form creates a message. Reception can open Messages, review the text, change its status (`new`, `read`, `replied`, or `archived`), and add internal notes. Do not put internal-only information in a customer-facing reply field; the internal note is for staff coordination.

### 7.5 Time slots

Reception can view, create, block, and unblock slots. A blocked slot is excluded from public availability. Enter a clear reason when blocking. Unblocking returns a slot to `available`, unless its booked count already fills capacity; in that case it returns to `reserved`.

---

## 8. Admin dashboard features

### Overview

Overview displays operational totals returned by the API, such as staff accounts, services, pending or approved bookings, failed email records, messages, and reception summary items. Clickable totals jump to their related dashboard section. Refresh when a recent change is not reflected.

### Staff accounts

Admins can create staff accounts for built-in or active custom roles, edit roles/permissions, reset another user's password, activate/deactivate accounts, or delete accounts. Use deactivation when access should be paused while preserving the account record. Give credentials to the staff member privately. The primary administrator cannot be deleted, deactivated, or downgraded.

### Services and testimonials

Services control public treatment display and booking. Admins can add/edit/toggle/delete service records. Testimonials can be maintained through the admin UI/API; the public frontend has a testimonial component and API endpoint, but the current homepage assembly does not mount that component. Do not promise that editing a testimonial will make it appear on the current homepage until that section is enabled in the frontend.

### Email notifications

Booking status actions may queue an approval, rejection, or reschedule email when the client supplied an email address. The admin Emails view shows delivery records and allows retrying failed ones. A failed email does not necessarily mean the appointment status failed; verify the booking status separately and contact the client by another approved channel if needed.

The configured mail provider can be console mode or SMTP. Console mode is a simulation and does not deliver mail; the record is labelled `simulated`. For real delivery, the backend needs `EMAIL_PROVIDER=smtp`, a verified `EMAIL_FROM`, and working SMTP relay settings. `sent` means accepted by the provider; the system does not label it delivered unless provider delivery feedback exists.

### Audit logs

Audit Logs are read-only records of sensitive actions, including authentication, booking changes, user management, call/visit entries, report creation, and other admin operations. Use them to answer who performed an action and when. They are not a substitute for appointment status history, which is specific to each booking.

### Legacy social activity records

Social Activity has been removed from dashboard navigation and API access. Existing historical social records remain in MongoDB and are not included in current operational reports.

### Clinic Settings

Clinic Settings controls:

- Weekly operating days and opening/closing times.
- Daily break intervals.
- Full clinic closed dates.
- Daily, weekly, and monthly report schedule settings.
- One-off special hours or closures that override the weekly schedule.

Times use Africa/Addis_Ababa. Saving hours affects generated/filtered availability. A report schedule being enabled in the dashboard is not enough by itself: the host must call the protected cron endpoint at intervals, and `REPORT_CRON_SECRET` must be configured privately. The current documented setup uses a cPanel cron job calling the Render API every five minutes.

### Account Settings

Each signed-in user can change their own email and password. Password change requires the current password and a matching new password (minimum 8 characters in the account flow). Production initial admin setup has stricter environment password requirements.

---

## 9. Reports

Reports are permission controlled and support daily, weekly, monthly, and custom inclusive date ranges, using the clinic's EAT time zone. Viewing reports requires `reports.view`; exporting requires `reports.export`. Patient names, card numbers, email, and phone are removed from report responses when the account lacks `patients.view`.

### Generate and save

1. Open **Reports**.
2. Choose a period and date/month/range.
3. Select **Generate preview** to calculate the report from stored records.
4. Select **Save to report history** if the report should be retained in the report-history collection.
5. Download CSV or Excel, or use Print / Save PDF if a PDF is needed. The audit-log page also offers a filtered CSV export to staff with export permission.
6. Use Share on WhatsApp to open a prefilled text summary, then choose the intended staff group and send manually. The application cannot verify WhatsApp delivery.

The Excel workbook contains summary, booking, patient, visit, call, message, email, PRP session, staff activity, and audit sheets. Treat exports with patient details as confidential. The PNG is a compact summary and excludes patient identifiers. CSV export includes summary metrics and available record details for the selected period. Print / Save PDF uses the browser's print dialog and its PDF export option.

### Report measures and limitations

- New bookings are counted by booking creation date and grouped by their saved treatment name.
- Service names are counted dynamically so new/renamed treatments are not silently excluded.
- Appointment outcomes use current status for appointments scheduled during the selected range; cancellation/no-show totals use status-history events in that range.
- Call totals use manually logged call records.
- Visit totals use receptionist daily visit records.
- Message counts use public contact messages; email attempts use provider attempt history. `sent` means provider accepted; `delivered` is counted only if reported by the provider.
- PRP totals use course sessions and saved treatment dates. Staff counts use audit events; older actions that were never logged are not inferred.
- Revenue, payments, invoices, clinical notes, and phone-system call imports are not part of this reporting system.
- If older bookings did not save a service-name snapshot, the report tries the referenced service record.

Scheduled report generation uses local EAT schedule checks and a unique period key to avoid duplicates after cron retries. It saves reports; it does not automatically send a file or WhatsApp message.

---

## 10. Data records in MongoDB

| Collection/model | What it stores |
| --- | --- |
| `User` | Staff name, unique email, password hash, role, active state, last login. |
| `Customer` | Client identity/contact, normalized contact fields, unique patient card number, and source. |
| `Sequence` / `CustomerIdentity` | Atomic patient card numbering and unique normalized contact reservations. |
| `PrpCourse` | Patient's six-session PRP course, treatment dates, completion state, and edit history. |
| `Service` | Treatment name/category, visibility, active/coming-soon state, duration, daily maximum. |
| `TimeSlot` | Service-specific appointment availability, time range, status, capacity, bookings count. |
| `Booking` | Appointment request, client snapshot, treatment snapshot/reference, requested/approved time, status, notes and staff references. |
| `BookingStatusHistory` | Each booking transition, actor, time, and optional note/reason. |
| `Message` | Public contact-form request, status, assignee, internal notes. |
| `CallActivity` | Manually entered call, caller phone, purpose, outcome, related treatment/booking, follow-up, staff. |
| `DailyVisit` | Walk-in visit date, card number, name, phone, service, notes, staff recorder. |
| `EmailNotification` | Outgoing booking email template, recipient, status, error/provider ID, booking link. |
| `Notification` | Persistent user-specific dashboard alert and read state. |
| `Role` | Custom role name, permissions, and active state. |
| `ClinicReport` | Saved report period, metrics, trigger, generator, sharing event, schedule key. |
| `AuditLog` | Staff action, entity, timestamp, and limited metadata. |
| `ClinicSettings` | Weekly operating hours, breaks, blocked dates, one-off schedule exceptions, report schedule. |

Booking and customer records are related but are not the same record. A customer can have multiple bookings. A booking keeps a snapshot of name/contact/treatment as submitted so it remains interpretable if the customer or service changes later.

---

## 11. API overview for technical trainees

Base production API is configured in the frontend environment files. Local backend defaults to `http://localhost:5000`; health check is `GET /api/health`.

| Route group | Access | Purpose |
| --- | --- | --- |
| `GET /api/services`, `/api/testimonials`, `/api/time-slots` | Public read | Public page content and currently available times. |
| `GET /api/clinic-hours` | Public read | Current weekly hours, closures, and special dates. |
| `POST /api/bookings`, `POST /api/messages` | Public write, rate-limited | Website appointment and contact submissions. |
| `/api/auth/login`, `/api/auth/me`, `/api/auth/change-*` | Login / authenticated | Staff sessions and own account changes. |
| `/api/reception/*` | Reception/admin or matching custom permission | Bookings, visits, testimonials, messages, slots, report view. Call activity is not a Reception route. |
| `/api/patients/*` | Authenticated staff with patient/PRP permissions | Patient search, registry, profile, PRP sessions. |
| `/api/calls/*` | Admin or Call Center Agent | Assigned call activity and follow-ups. Agents are limited to their assignments. |
| `/api/notifications/*` | Authenticated staff | User-specific stored alerts and read state. |
| `/api/admin/*` | Admin or matching custom permission | Dashboard, users, bookings, services, slots, emails, audit, roles, reports, settings. Exports require `reports.export`. |
| `POST /api/cron/reports/run` | Bearer cron secret | Checks whether a scheduled report is due. |

Common operational endpoints:

```text
GET    /api/health
POST   /api/auth/login
GET    /api/auth/me
GET    /api/reception/bookings
POST   /api/reception/bookings
PATCH  /api/reception/bookings/:id/approve
PATCH  /api/reception/bookings/:id/reject
PATCH  /api/reception/bookings/:id/reschedule
GET    /api/patients?q=...
GET    /api/calls
POST   /api/calls
PATCH  /api/calls/:id
GET    /api/reception/visits
POST   /api/reception/visits
GET    /api/admin/reports/preview
POST   /api/admin/reports/generate
GET    /api/admin/reports
GET    /api/admin/reports/export.csv
GET    /api/admin/audit-logs/export.csv
```

Protected requests use `Authorization: Bearer <staff-token>`. Request bodies are validated with Zod schemas; invalid inputs return an API error instead of being accepted silently. Public booking/contact writes and login have rate limits.

The full route implementation is in `liv_estetik-backend/routes/`; use `liv_estetik-backend/ENDPOINTS.md` as an additional reference and keep it synchronized with the route files.

---

## 12. Deployments, builds, and environment

### cPanel static website uploads

The latest prepared archives are at the project root:

- `liv-estetik-public-liv.zip` — extract into the main site's document root.
- `liv-estetik-admin-liv.zip` — extract into the admin subdomain's document root.

Each ZIP contains the compiled build with `index.html` at its root. Extract them into **separate** document roots. The archives contain no backend `.env` file. Rebuild and recreate the ZIP after frontend source, API URL, or public image changes.

### Backend/API deployment

The backend runs as a Node.js service (currently intended for Render). It needs a reachable MongoDB database and private environment variables. Important variable names include `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PORT`, `CLIENT_ORIGIN`, `JWT_EXPIRES_IN`, and mail settings (`EMAIL_PROVIDER`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Scheduled reports also need `REPORT_CRON_SECRET`.

In production:

- `MONGO_URI` must include the actual database name in its path.
- `JWT_SECRET` must be at least 32 characters.
- `ADMIN_PASSWORD` must be at least 16 characters for production bootstrap configuration.
- `EMAIL_PROVIDER=console` means mail is simulated and not delivered. Real delivery requires `EMAIL_PROVIDER=smtp`, a verified `EMAIL_FROM`, and the SMTP relay credentials.
- `CLIENT_ORIGIN` must allow the exact public and admin website origins if defaults do not apply.
- Never place these secrets in frontend `.env.production`, public folders, cPanel public roots, or Git.

### Local development commands

Run these from the relevant application folder:

```sh
# Public website
cd liv_estetik-frontend
npm install
npm run dev

# Staff dashboard (separate terminal)
cd liv_estetik-admin
npm install
npm run dev

# Backend API (separate terminal)
cd liv_estetik-backend
npm install
npm run dev
```

Frontend and admin ports are defined in their Vite configuration. The backend defaults to port 5000. Local API proxying and production API URLs are configured separately. Local backend uses MongoDB at `127.0.0.1:27017/liv-estetik` only when `NODE_ENV` is not production and no `MONGO_URI` overrides it.

Useful backend scripts:

| Command | Purpose |
| --- | --- |
| `npm start` | Start API server. |
| `npm run dev` | Start API with nodemon. |
| `npm run seed` | Seed initial admin plus sample services/testimonials; review script behavior before using against any database. |
| `npm run bootstrap:admin` | Create or reset the configured admin account from private environment settings. |
| `npm run migrate:reporting` | Backfill normalized customer phone keys and mark legacy booking sources as unknown. |
| `npm run migrate:patient-cards` | Add missing patient card numbers, normalize existing contact fields, and reserve non-conflicting contact identities. |
| `npm run migrate:protect-primary-admin` | Protect the existing account matching `ADMIN_EMAIL` from deletion/deactivation/role downgrade. |
| `npm test` | Run backend Node tests. |

Do not run seed, cleanup, migration, or bootstrap scripts against production unless the operation is understood, the correct database is confirmed, and a backup/authorized maintenance plan is in place.

---

## 13. Common problems and response steps

### Staff login says “Invalid email or password”

1. Confirm the account email spelling and whether the account is active.
2. Confirm the dashboard is pointing to the correct production API.
3. Check the API is healthy and connected to the database containing staff accounts.
4. An admin can reset another staff member's password. For the configured admin, use the documented bootstrap procedure only when authorized.
5. Do not share passwords in a chat or training document.

### Public services are empty

1. Check API health.
2. Check that the API is connected to the intended Mongo database (the startup log reports the database name, not the URI).
3. Check that service records exist and `visible` is enabled.
4. Remember that a visible but inactive service may be shown as coming soon and is not bookable.

### No appointment times appear

Check service active/capacity/duration, clinic operating hours, breaks, closed dates, generated slot records, slot status/capacity, and API/database health. The public API is the source of truth for available times. For hair transplant see Section 5.5.

### Client submitted booking but staff cannot find it

1. Ask for the client's name, phone, treatment, and approximate submission time.
2. Refresh Bookings and search by phone/name; remove filters and set agenda to all requests.
3. Confirm the public form received its success message; a frontend confirmation should only follow a successful API response.
4. Check backend logs for validation, slot conflict, database, or status-history write errors.
5. Check the website and dashboard use the same API environment and that API is connected to the intended database.

### Booking appears but the email did not arrive

Check the booking status first, then open Email Notifications. A failed notification is a separate delivery issue. Retry after checking recipient address and configured mail provider; contact the client through an approved alternate channel if needed.

### Report is empty or missing calls/visits

Confirm the report date/range in Addis Ababa time. Calls are included by their logged time; visits by their visit date; bookings are shown in the detail sheet by creation time. Calls and social events must be manually entered. New visit records appear in reports after the latest backend containing the `DailyVisit` model is deployed.

### cPanel page loads but login/booking does not work

The cPanel archives only contain static frontends. Confirm `VITE_API_BASE_URL` / `VITE_API_URL` were set before the build, the deployed API is online, CORS allows the cPanel origins, and the API can connect to MongoDB. Rebuild the correct frontend if its API base URL is wrong. Never fix this by publishing database credentials.

### MongoDB connection fails on Render

Check the production `MONGO_URI` includes the right database name, database username/password are correct and URL-encoded, cluster is active, and Atlas network access permits the Render service's outbound IP ranges. Do not log or paste a URI containing credentials. A successful API deploy does not by itself prove it is using the database with clinic records.

---

## 14. Suggested staff training exercises

Use a non-production/test environment for practice where possible.

1. Sign in and identify the user's role and available menu items.
2. Find a pending booking, inspect its details, and locate its status history.
3. Practice adding an internal note. In a training record, practice approving, rescheduling, and cancelling according to the approved clinic workflow.
4. Add a sample call, assign a follow-up, then correct the caller phone/name context and mark follow-up handled.
5. Record a sample daily visit with all required fields and confirm it appears in Recent Visitors.
6. Submit a test public contact message and move it through read/replied status.
7. For admins, inspect service active/visible/capacity controls and verify how a setting affects bookability.
8. Generate a daily report preview, compare its counts to the underlying test records, download Excel/PNG, and explain which report data is manually entered.
9. Review how to report a login, booking, email, or database problem without sharing passwords or secrets.

Do not enter fabricated practice patients into the live production database. If practice must occur in production, agree on a clinic-approved test-record procedure and remove/mark the records appropriately through an auditable workflow.

---

## 15. Glossary

- **API:** backend endpoints that the websites call to read or write clinic data.
- **Booking request:** a saved request awaiting staff action; a pending request is not necessarily confirmed.
- **Customer:** reusable client record that can be linked to several bookings.
- **Service:** treatment catalog entry; active/visible/capacity settings determine whether it appears and can be booked.
- **Time slot:** service-specific appointment time with status and capacity.
- **Status history:** chronological record of appointment status changes.
- **Audit log:** record of staff/system actions for accountability.
- **EAT:** East Africa Time, used by clinic scheduling and report periods (UTC+3).
- **Manual activity:** an event staff enter themselves; the system does not import or verify it from a phone/social platform.
- **cPanel document root:** folder served by a domain/subdomain, commonly `public_html` for the main site.

---

## 16. Source map for maintainers

| Area | Main code location |
| --- | --- |
| Public page assembly and booking | `liv_estetik-frontend/src/App.jsx`, `src/sections/booking/` |
| Public API calls | `liv_estetik-frontend/src/api.js` |
| Staff pages and role navigation | `liv_estetik-admin/src/views/`, `src/dashboardConfig.js` |
| Staff API client | `liv_estetik-admin/src/api.js` |
| API assembly and middleware | `liv_estetik-backend/app.js`, `routes/`, `middleware/` |
| Booking/time-slot rules | `liv_estetik-backend/service/booking_service.js`, `service/slot_service.js`, `service/slot_generator.js` |
| Reception call/visit/report data | `liv_estetik-backend/controllers/operations_controller.js`, `models/call_activity.js`, `models/daily_visit.js`, `service/reporting_service.js` |
| Mongo models | `liv_estetik-backend/models/` |
| Environment validation and database | `liv_estetik-backend/config/env.js`, `config/db.js` |
| Current upload steps | `liv_estetik-frontend/CPANEL_UPLOAD_GUIDE.txt` |

