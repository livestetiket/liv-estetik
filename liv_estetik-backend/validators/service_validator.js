const { z } = require("zod");

const CATEGORIES = ["Hair", "Skin / Anti-aging", "Body"];

const createServiceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1).max(80),
  description: z.string().optional(),
  icon: z.string().optional(),
  active: z.boolean().optional().default(true),
  visible: z.boolean().optional().default(true),
  isComingSoon: z.boolean().optional().default(false),
  // Duration in minutes (required)
  estimatedDurationMinutes: z.coerce.number().int().min(1),
  // Required: how many appointments for this service per day (0 allowed for "coming soon")
  maxAppointmentsPerDay: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().optional().default(0),
});

const updateServiceSchema = createServiceSchema.partial();

module.exports = { createServiceSchema, updateServiceSchema };
