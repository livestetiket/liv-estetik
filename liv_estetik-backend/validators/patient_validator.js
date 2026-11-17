const { z } = require("zod");

const patientFields = {
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  age: z.number().int().min(1).max(120).optional().nullable(),
  sex: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
};

const contactRequired = (value, ctx) => {
  if (!value.email && !value.phone) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Enter a phone number or email address." });
};

const createPatientSchema = z.object(patientFields).superRefine(contactRequired);
const updatePatientSchema = z.object(Object.fromEntries(Object.entries(patientFields).map(([key, schema]) => [key, schema.optional()]))).partial();

const updatePrpSessionSchema = z.object({
  treatmentDate: z.coerce.date().nullable().optional(),
  completed: z.boolean().optional(),
}).refine((value) => value.treatmentDate !== undefined || value.completed !== undefined, { message: "Provide a session date or completion status." });

module.exports = { createPatientSchema, updatePatientSchema, updatePrpSessionSchema };
