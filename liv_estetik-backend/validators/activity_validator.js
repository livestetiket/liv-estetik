const { z } = require("zod");

const id = z.string().regex(/^[0-9a-fA-F]{24}$/);
const date = z.coerce.date();
const webUrl = z.string().trim().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "URL must use HTTP or HTTPS");

const createCallSchema = z.object({
  direction: z.enum(["inbound", "outbound"]),
  phone: z.string().trim().max(30).optional(),
  purpose: z.string().trim().min(2).max(120),
  service: id.optional(),
  outcome: z.enum(["booking_created", "consultation_inquiry", "follow_up", "information_provided", "no_answer", "unsuccessful", "other"]),
  booking: id.optional(),
  followUpRequired: z.boolean().optional(),
  followUpAt: date.optional(),
  notes: z.string().trim().max(2000).optional(),
  loggedAt: date.optional(),
});

const updateCallSchema = createCallSchema.partial();
const createPostSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "facebook", "youtube"]),
  postUrl: webUrl.optional(),
  platformPostId: z.string().trim().max(180).optional(),
  publishedAt: date,
  notes: z.string().trim().max(1000).optional(),
});
const createFollowerSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "facebook", "youtube"]).default("tiktok"),
  count: z.coerce.number().int().min(0),
  observedAt: date.optional(),
});
const generateReportSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "custom"]),
  date: z.string().optional(), month: z.string().optional(), from: z.string().optional(), to: z.string().optional(),
});
const clinicSettingsSchema = z.object({
  operatingWindows: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startMinute: z.number().int().min(0).max(1439), endMinute: z.number().int().min(1).max(1440) }).refine((item) => item.endMinute > item.startMinute, "Closing time must be after opening time")).max(7).refine((rows) => new Set(rows.map((row) => row.dayOfWeek)).size === rows.length, "Each weekday can only have one operating window"),
  breaks: z.array(z.object({ name: z.string().trim().max(80).optional(), startMinute: z.number().int().min(0).max(1439), endMinute: z.number().int().min(1).max(1440) }).refine((item) => item.endMinute > item.startMinute, "Break end must be after start")).max(8),
  blockedLocalDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(180),
  reportSchedulesEnabled: z.boolean(),
  reportDailyTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|05|10|15|20|25|30|35|40|45|50|55)$/),
  reportWeeklyDay: z.number().int().min(0).max(6),
  reportWeeklyTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|05|10|15|20|25|30|35|40|45|50|55)$/),
  reportMonthlyTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|05|10|15|20|25|30|35|40|45|50|55)$/),
});

module.exports = { createCallSchema, updateCallSchema, createPostSchema, createFollowerSchema, generateReportSchema, clinicSettingsSchema };
