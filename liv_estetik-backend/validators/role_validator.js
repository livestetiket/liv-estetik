const { z } = require("zod");
const { PERMISSIONS } = require("../service/permissions");

const roleFields = {
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length),
  active: z.boolean().optional(),
};

const createRoleSchema = z.object(roleFields);
const updateRoleSchema = z.object(Object.fromEntries(Object.entries(roleFields).map(([key, value]) => [key, value.optional()]))).partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

module.exports = { createRoleSchema, updateRoleSchema };
