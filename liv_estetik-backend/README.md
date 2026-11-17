# Liv Estetik Backend

Express and MongoDB API for the public booking website and staff dashboard.

## Scripts

- `npm install` - install dependencies
- `npm start` - run production server
- `npm run dev` - run development server with nodemon
- `npm run seed` - add initial admin, sample services, and testimonials

## Configuration

The API defaults to port `5000`; set `PORT` to override it. For production, set
`NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET` (at least 32 characters),
`ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 16 characters). Production startup
does not use the development JWT or admin credential defaults.

The `scripts/clear_*` database cleanup scripts run only when `NODE_ENV` is not
production and `MONGO_URI` explicitly points to `localhost`, `127.0.0.1`, or
`::1`.

Copy `.env.example` for a local environment and replace its placeholders. Do not commit a real `.env` file or copy backend secrets into either Vite frontend. Email uses `EMAIL_PROVIDER=console` by default; this mode logs a simulated attempt and sends no mail. For delivery, set `EMAIL_PROVIDER=smtp`, a verified `EMAIL_FROM`, and the SMTP relay settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) in the backend environment.

Before production deployment, back up the database and confirm the target database name in `MONGO_URI`. Run `npm run migrate:patient-cards` to add missing patient cards, normalize contact fields, and reserve unique contact identities without merging existing records. Run `npm run migrate:protect-primary-admin` after confirming `ADMIN_EMAIL` matches the intended administrator. These scripts are additive and should only be run against the intended database.

## Endpoints

- `GET /` - returns a welcome JSON message
