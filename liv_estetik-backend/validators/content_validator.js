const { z } = require("zod");

const createTestimonialSchema = z.object({
  quote: z.string().trim().min(1, "Quote is required"),
  name: z.string().trim().min(1, "Name is required"),
  initials: z.string().trim().min(1, "Initials are required"),
  service: z.string().trim().optional(),
  rating: z.coerce.number().min(1).max(5).optional().default(5),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

const updateTestimonialSchema = createTestimonialSchema.partial();

const createMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("A valid email is required"),
  message: z.string().trim().min(1, "Message is required"),
});

const updateMessageSchema = z.object({
  status: z.enum(["new", "read", "replied", "archived"]).optional(),
  internalNotes: z.string().optional(),
  assignedTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

module.exports = {
  createTestimonialSchema,
  updateTestimonialSchema,
  createMessageSchema,
  updateMessageSchema,
};