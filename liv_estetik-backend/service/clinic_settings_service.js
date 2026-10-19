const ClinicSettings = require("../models/clinic_settings");

async function getClinicSettings() {
  let settings = await ClinicSettings.findOne({ key: "clinic" });
  if (!settings) settings = await ClinicSettings.create({ key: "clinic" });
  return settings;
}

function localParts(date) {
  const values = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(values.filter((part) => part.type !== "literal").map(({ type, value }) => [type, Number(value)]));
}

function isSlotWithinSettings(start, end, settings) {
  const parts = localParts(start);
  const key = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const startMinute = parts.hour * 60 + parts.minute;
  const endParts = localParts(end);
  const endKey = `${endParts.year}-${String(endParts.month).padStart(2, "0")}-${String(endParts.day).padStart(2, "0")}`;
  const endMinute = endParts.hour * 60 + endParts.minute;
  if (endKey !== key || settings.blockedLocalDates.includes(key)) return false;
  const window = settings.operatingWindows.find((item) => item.dayOfWeek === weekday);
  if (!window || startMinute < window.startMinute || endMinute > window.endMinute) return false;
  return !settings.breaks.some((item) => startMinute < item.endMinute && endMinute > item.startMinute);
}

module.exports = { getClinicSettings, isSlotWithinSettings };
