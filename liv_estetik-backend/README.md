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

## Endpoints

- `GET /` - returns a welcome JSON message
