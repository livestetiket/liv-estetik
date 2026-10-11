# Liv Estetik API Endpoints

Base URL: `http://localhost:5000` (default backend port; override with `PORT`)

> Use `Content-Type: application/json` for all request bodies.
> For protected routes use `Authorization: Bearer <token>`.

---

## Public / No auth

### GET /api/health
- Description: API health check
- Response: `{ status: "ok", service: "liv-estetik-api" }`

### GET /api/services
- Description: List public services
- Auth: none

### GET /api/testimonials
- Description: List public testimonials
- Auth: none

### GET /api/time-slots
- Description: List available time slots for booking
- Auth: none

### POST /api/bookings
- Description: Create a new booking request (one service per booking)
- Auth: none
- Rate limited
- Body:
  - `fullName` (string, required)
  - `age` (number, required)
  - `sex` (string, required)
  - `phone` (string, optional)
  - `address` (string, optional)
  - `email` (string, required, valid email)
  - `service` (string ID, required, must be an active service, cannot be marked as coming soon)
  - `requestedSlot` (string ID, required)
  - `notes` (string, optional)

Example:
```json
{
  "fullName": "Jane Doe",
  "age": 32,
  "sex": "Female",
  "phone": "555-1234",
  "address": "123 Main St",
  "email": "jane@example.com",
  "service": "64f1a1b2c3d4e5f607890123",
  "requestedSlot": "64f1a9b0c3d4e5f607890456",
  "notes": "Please call before arriving."
}
```

### POST /api/messages
- Description: Submit a public message/contact request
- Auth: none
- Rate limited
- Body:
  - `name` (string, required)
  - `email` (string, required, valid email)
  - `message` (string, required)

Example:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "I would like to book a consultation."
}
```

---

## Auth

### POST /api/auth/login
- Description: Authenticate and receive a JWT token
- Auth: none
- Body:
  - `email` (string, required)
  - `password` (string, required)

Response body contains:
- `token` (JWT string)
- `user` object with `id`, `name`, `email`, `role`

Example:
```json
{
  "email": "admin@example.com",
  "password": "YourPassword123"
}
```

### GET /api/auth/me
- Description: Get authenticated user details
- Auth: required
- Header: `Authorization: Bearer <token>`
- Response: authenticated user data

### POST /api/auth/change-email
- Description: Change your email address
- Auth: required
- Header: `Authorization: Bearer <token>`
- Body:
  - `email` (string, required, valid email, must be unique)

Example:
```json
{ "email": "newemail@example.com" }
```

Response: Updated user data with new email

### POST /api/auth/change-password
- Description: Change your password
- Auth: required
- Header: `Authorization: Bearer <token>`
- Body:
  - `currentPassword` (string, required)
  - `newPassword` (string, required, minimum 8 characters)
  - `confirmPassword` (string, required, must match newPassword)

Example:
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

Response: Updated user data

## Reception routes (`/api/reception`)

> Requires authenticated user with role `reception` or `admin`.

### GET /api/reception/dashboard
- Description: Reception dashboard summary
- Auth: required

### GET /api/reception/bookings
- Description: List bookings for reception
- Auth: required

### GET /api/reception/bookings/:id
- Description: Get one booking by ID
- Auth: required
- Path params:
  - `id` (booking ID)

### PATCH /api/reception/bookings/:id/approve
- Description: Approve a booking
- Auth: required
- Body:
  - `message` (string, optional)

### PATCH /api/reception/bookings/:id/reject
- Description: Reject a booking
- Auth: required
- Body:
  - `reason` (string, required)

Example:
```json
{ "reason": "Requested slot unavailable" }
```

### PATCH /api/reception/bookings/:id/reschedule
- Description: Reschedule a booking
- Auth: required
- Body:
  - `newSlot` (string ID, required)
  - `reason` (string, required)

Example:
```json
{ "newSlot": "64f1a9b0c3d4e5f607890789", "reason": "Client requested new time" }
```

### PATCH /api/reception/bookings/:id/complete
- Description: Mark booking as complete
- Auth: required

### PATCH /api/reception/bookings/:id/cancel
- Description: Cancel a booking
- Auth: required
- Body:
  - `reason` (string, optional)

### PATCH /api/reception/bookings/:id/note
- Description: Add internal note to a booking
- Auth: required
- Body:
  - `note` (string, required)

### GET /api/reception/messages
- Description: List messages for reception
- Auth: required

### PATCH /api/reception/messages/:id
- Description: Update a message
- Auth: required
- Body can include one or more of:
  - `status` (one of `new`, `read`, `replied`, `archived`)
  - `internalNotes` (string)
  - `assignedTo` (string user ID)

Example:
```json
{ "status": "read", "internalNotes": "Followed up" }
```

### GET /api/reception/time-slots
- Description: List time slots for reception
- Auth: required

### PATCH /api/reception/time-slots/:id/block
- Description: Block a time slot
- Auth: required
- Body:
  - `reason` (string, required)

Example:
```json
{ "reason": "Holiday closure" }
```

### PATCH /api/reception/time-slots/:id/unblock
- Description: Unblock a time slot
- Auth: required

---

## Admin routes (`/api/admin`)

> Requires authenticated user with role `admin`.

### GET /api/admin/dashboard
- Description: Admin dashboard summary
- Auth: required

### Users

#### GET /api/admin/users
- Description: List users
- Auth: required

#### POST /api/admin/users
- Description: Create a user
- Auth: required
- Body:
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required, min 8 chars)
  - `role` (`reception` or `admin`, required)
  - `phone` (string, optional)
  - `active` (boolean, optional)

#### PATCH /api/admin/users/:id
- Description: Update a user
- Auth: required
- Body: any of:
  - `name` (string)
  - `email` (string)
  - `password` (string, min 8 chars)
  - `role` (`reception` or `admin`)
  - `phone` (string)
  - `active` (boolean)

#### DELETE /api/admin/users/:id
- Description: Delete a user
- Auth: required

#### POST /api/admin/users/:id/reset-password
- Description: Reset a user's password (admin only, cannot reset own password)
- Auth: required
- Body:
  - `newPassword` (string, required, min 8 chars)

Example:
```json
{ "newPassword": "TemporaryPassword123" }
```

Response: Updated user data

#### GET /api/admin/bookings
- Description: List bookings
- Auth: required

#### GET /api/admin/bookings/:id
- Description: Get booking details
- Auth: required

#### PATCH /api/admin/bookings/:id/approve
- Description: Approve booking
- Auth: required
- Body:
  - `message` (string, optional)

#### PATCH /api/admin/bookings/:id/reject
- Description: Reject booking
- Auth: required
- Body:
  - `reason` (string, required)

#### PATCH /api/admin/bookings/:id/reschedule
- Description: Reschedule booking
- Auth: required
- Body:
  - `newSlot` (string ID, required)
  - `reason` (string, required)

#### DELETE /api/admin/bookings/:id
- Description: Hard delete booking
- Auth: required

### Services

#### GET /api/admin/services
- Description: List services
- Auth: required

#### POST /api/admin/services
- Description: Create a service
- Auth: required
- Body:
  - `name` (string, required)
  - `category` (one of `Hair`, `Skin / Anti-aging`, `Body`, required)
  - `description` (string, optional)
  - `icon` (string, optional)
  - `active` (boolean, optional, default: true)
  - `visible` (boolean, optional, default: true)
  - `isComingSoon` (boolean, optional, default: false)
  - `estimatedDurationMinutes` (number, required)
  - `maxAppointmentsPerDay` (number, required)
  - `sortOrder` (number, optional)

#### PATCH /api/admin/services/:id
- Description: Update a service (any service fields from create schema)
- Auth: required
- Body: any of:
  - `name` (string)
  - `category` (one of `Hair`, `Skin / Anti-aging`, `Body`)
  - `description` (string)
  - `icon` (string)
  - `active` (boolean)
  - `visible` (boolean)
  - `isComingSoon` (boolean)
  - `estimatedDurationMinutes` (number)
  - `maxAppointmentsPerDay` (number)
  - `sortOrder` (number)

#### DELETE /api/admin/services/:id
- Description: Delete a service
- Auth: required

### Time slots

#### GET /api/admin/time-slots
- Description: List time slots
- Auth: required

#### POST /api/admin/time-slots
- Description: Create a time slot
- Auth: required
- Body:
  - `startsAt` (date/time, required)
  - `endsAt` (date/time, required)
  - `capacity` (number, optional)
  - `status` (one of `available`, `unavailable`, `reserved`, `blocked`, optional)
  - `blockedReason` (string, optional)

Example:
```json
{
  "startsAt": "2026-07-10T09:00:00.000Z",
  "endsAt": "2026-07-10T10:00:00.000Z",
  "capacity": 1,
  "status": "available"
}
```

#### PATCH /api/admin/time-slots/:id
- Description: Update a time slot
- Auth: required
- Body: any slot fields from create schema

#### DELETE /api/admin/time-slots/:id
- Description: Delete a time slot
- Auth: required

### Testimonials

#### GET /api/admin/testimonials
- Description: List testimonials
- Auth: required

#### POST /api/admin/testimonials
- Description: Create a testimonial
- Auth: required
- Body:
  - `quote` (string, required)
  - `name` (string, required)
  - `initials` (string, required)
  - `service` (string, optional)
  - `rating` (number, optional, 1-5)
  - `active` (boolean, optional)
  - `sortOrder` (number, optional)

#### PATCH /api/admin/testimonials/:id
- Description: Update a testimonial
- Auth: required
- Body: any testimonial fields from create schema

#### DELETE /api/admin/testimonials/:id
- Description: Delete a testimonial
- Auth: required

### Email notifications

#### GET /api/admin/email-notifications
- Description: List email notifications
- Auth: required

#### PATCH /api/admin/email-notifications/:id/retry
- Description: Retry sending an email notification
- Auth: required

### Audit logs

#### GET /api/admin/audit-logs
- Description: List audit logs
- Auth: required

---

## Notes
- Use the returned `token` from `POST /api/auth/login` as `Authorization: Bearer <token>`.
- Reception routes require `reception` or `admin` role.
- Admin routes require `admin` role.
- All endpoints expect JSON bodies when a body is required.
- Date/time values are accepted in standard ISO 8601 format.
