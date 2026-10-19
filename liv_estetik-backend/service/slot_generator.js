const TimeSlot = require("../models/timeslot");
const Service = require("../models/service");
const { getClinicSettings, isSlotWithinSettings } = require("./clinic_settings_service");

const TZ = "Africa/Addis_Ababa";
const DAY_MS = 86400000;

function localDateParts(value) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map(({ type, value: partValue }) => [type, Number(partValue)]));
}

function addCalendarDays(parts, amount) {
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

function localDateKey(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function localMinuteToUtc(parts, minute) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, minute) - (3 * 60 * 60 * 1000));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function overlaps(start, end, blockedStart, blockedEnd) {
  return start < blockedEnd && end > blockedStart;
}

async function generateSlotsForDate(targetDate) {
  const parts = localDateParts(targetDate);
  const dateKey = localDateKey(parts);
  if (dateKey <= localDateKey(localDateParts(new Date()))) return { created: 0, skipped: true, reason: "not_future" };

  const settings = await getClinicSettings();
  if (settings.blockedLocalDates.includes(dateKey)) return { created: 0, skipped: true, reason: "blocked_date" };
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const window = settings.operatingWindows.find((item) => item.dayOfWeek === weekday);
  if (!window) return { created: 0, skipped: true, reason: "closed" };

  const start = localMinuteToUtc(parts, window.startMinute);
  const end = localMinuteToUtc(parts, window.endMinute);
  const existing = await TimeSlot.find({ startsAt: { $gte: localMinuteToUtc(parts, 0), $lt: localMinuteToUtc(addCalendarDays(parts, 1), 0) } }).sort({ startsAt: 1 }).lean();
  const services = await Service.find({ active: true, maxAppointmentsPerDay: { $gt: 0 } }).sort({ sortOrder: 1 }).lean();
  let created = 0;

  for (const service of services) {
    const serviceSlots = existing.filter((slot) => String(slot.service) === String(service._id) && isSlotWithinSettings(slot.startsAt, slot.endsAt, settings));
    const remaining = Math.max(0, service.maxAppointmentsPerDay - serviceSlots.length);
    if (!remaining || !service.estimatedDurationMinutes) continue;
    let cursor = new Date(start);
    let createdForService = 0;
    while (addMinutes(cursor, service.estimatedDurationMinutes) <= end && createdForService < remaining) {
      const slotEnd = addMinutes(cursor, service.estimatedDurationMinutes);
      const inBreak = settings.breaks.some((item) => overlaps(cursor, slotEnd, localMinuteToUtc(parts, item.startMinute), localMinuteToUtc(parts, item.endMinute)));
      const occupied = serviceSlots.some((slot) => overlaps(cursor, slotEnd, slot.startsAt, slot.endsAt));
      if (!inBreak && !occupied) {
        try {
          const result = await TimeSlot.updateOne({ service: service._id, startsAt: cursor }, { $setOnInsert: { service: service._id, startsAt: cursor, endsAt: slotEnd, capacity: 1, bookedCount: 0, status: "available" } }, { upsert: true });
          if (result.upsertedCount) { created += 1; createdForService += 1; }
        } catch (error) {
          if (error.code !== 11000) throw error;
        }
      }
      cursor = slotEnd;
    }
  }
  return { created, skipped: false };
}

async function generateSlotsForNextDays(days = 14) {
  const results = [];
  const today = localDateParts(new Date());
  for (let offset = 1; offset <= days; offset += 1) {
    const target = addCalendarDays(today, offset);
    const dayStart = localMinuteToUtc(target, 0);
    // eslint-disable-next-line no-await-in-loop
    const result = await generateSlotsForDate(dayStart);
    results.push({ date: localDateKey(target), ...result });
  }
  return results;
}

module.exports = { generateSlotsForDate, generateSlotsForNextDays, localDateParts, localDateKey, localMinuteToUtc };
