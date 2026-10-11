const { z } = require("zod");

const STATUSES = ["available", "unavailable", "reserved", "blocked"];

const createSlotSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    service: z.string().min(1, "Service ID is required"),
    capacity: z.coerce.number().int().min(1).optional().default(1),
    status: z.enum(STATUSES).optional().default("available"),
    blockedReason: z.string().optional(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

// Prevent creating slots in the past by default
createSlotSchema.refine((data) => data.startsAt > new Date(), {
  message: "startsAt must be a future date",
  path: ["startsAt"],
});

const updateSlotSchema = z.object({
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  service: z.string().optional(),
  capacity: z.coerce.number().int().min(1).optional(),
  status: z.enum(STATUSES).optional(),
  blockedReason: z.string().optional(),
});

const blockSlotSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required to block a slot"),
});

module.exports = { createSlotSchema, updateSlotSchema, blockSlotSchema };