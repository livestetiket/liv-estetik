const ClinicReport = require("../models/clinic_report");
const { getClinicSettings } = require("./clinic_settings_service");
const { getPeriod, generateAndSave } = require("./reporting_service");

function localParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(parts.filter((item) => item.type !== "literal").map(({ type, value }) => [type, type === "year" || type === "month" || type === "day" || type === "hour" || type === "minute" ? Number(value) : value]));
}

const WEEKDAY_NUMBER = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localDateKey(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function matchesSchedule(now, time) {
  const parts = localParts(now);
  parts.dayOfWeek = WEEKDAY_NUMBER[parts.weekday];
  const [hour, minute] = time.split(":").map(Number);
  return parts.hour * 60 + parts.minute >= hour * 60 + minute;
}

function dueReportTypes(now, settings) {
  const parts = localParts(now);
  parts.dayOfWeek = WEEKDAY_NUMBER[parts.weekday];
  const due = [];
  if (matchesSchedule(now, settings.reportDailyTime)) due.push("daily");
  if (parts.dayOfWeek === settings.reportWeeklyDay && matchesSchedule(now, settings.reportWeeklyTime)) due.push("weekly");
  const tomorrow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  if (tomorrow.getUTCMonth() + 1 !== parts.month && matchesSchedule(now, settings.reportMonthlyTime)) due.push("monthly");
  return due;
}

async function createScheduledReport(type, period) {
  const scheduleKey = `${type}:${period.start.toISOString()}`;
  if (await ClinicReport.exists({ scheduleKey })) return { type, period: period.label, status: "already_generated" };
  await generateAndSave(period, null, { trigger: "scheduled", scheduleKey });
  return { type, period: period.label, status: "generated" };
}

async function runDueScheduledReports(now = new Date()) {
  const settings = await getClinicSettings();
  if (!settings.reportSchedulesEnabled) return { enabled: false, reports: [] };
  const parts = localParts(now);
  parts.dayOfWeek = WEEKDAY_NUMBER[parts.weekday];
  const date = localDateKey(parts);
  const reports = [];
  for (const type of dueReportTypes(now, settings)) {
    const period = type === "monthly" ? getPeriod(type, { month: `${parts.year}-${String(parts.month).padStart(2, "0")}` }) : getPeriod(type, { date });
    // eslint-disable-next-line no-await-in-loop
    reports.push(await createScheduledReport(type, period));
  }
  return { enabled: true, reports };
}

module.exports = { runDueScheduledReports, dueReportTypes };
