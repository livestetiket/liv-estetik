const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["reception", "admin"]),
  phone: z.string().trim().optional(),
  active: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["reception", "admin"]).optional(),
  phone: z.string().trim().optional(),
  active: z.boolean().optional(),
});

const changeEmailSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

module.exports = { loginSchema, createUserSchema, updateUserSchema, changeEmailSchema, changePasswordSchema, resetPasswordSchema };