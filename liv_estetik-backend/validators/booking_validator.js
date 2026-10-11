const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// POST /api/bookings
const createBookingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  age: z.coerce.number().int().min(1).max(120),
  sex: z.string().trim().min(1, "Sex/gender is required"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  email: z.string().trim().email("A valid email is required"),
  service: objectId,
  requestedSlot: objectId,
  notes: z.string().max(2000).optional(),
});

// PATCH /api/reception/bookings/:id/approve
const approveBookingSchema = z.object({
  message: z.string().trim().optional(),
});

// PATCH /api/reception/bookings/:id/reject
const rejectBookingSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required"),
});

// PATCH /api/reception/bookings/:id/reschedule
const rescheduleBookingSchema = z.object({
  newSlot: objectId,
  reason: z.string().trim().min(1, "Reschedule reason is required"),
});

module.exports = {
  createBookingSchema,
  approveBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
};