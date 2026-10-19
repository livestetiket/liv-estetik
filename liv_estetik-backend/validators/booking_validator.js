const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// POST /api/bookings
const createBookingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  age: z.coerce.number().int().min(1).max(120).optional(),
  sex: z.string().trim().optional(),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().optional(),
  email: z.union([z.string().trim().email("A valid email is required"), z.literal("")]).optional(),
  service: objectId,
  requestedSlot: objectId,
  notes: z.string().max(2000).optional(),
});

const createReceptionBookingSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(7).max(30),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  service: objectId,
  requestedSlot: objectId,
  source: z.enum(["phone", "whatsapp", "tiktok", "instagram", "facebook", "walk_in", "referral", "other"]),
  notes: z.string().trim().max(2000).optional(),
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
  createReceptionBookingSchema,
  approveBookingSchema,
  rejectBookingSchema,
  rescheduleBookingSchema,
};
