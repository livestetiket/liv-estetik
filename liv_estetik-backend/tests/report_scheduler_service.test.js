const test = require("node:test");
const assert = require("node:assert/strict");
const { dueReportTypes } = require("../service/report_scheduler_service");

const settings = { reportDailyTime: "20:00", reportWeeklyDay: 0, reportWeeklyTime: "20:00", reportMonthlyTime: "20:00" };

test("scheduler waits until configured Addis time", () => {
  assert.deepEqual(dueReportTypes(new Date("2026-10-19T16:55:00Z"), settings), []);
  assert.deepEqual(dueReportTypes(new Date("2026-10-19T17:00:00Z"), settings), ["daily"]);
});

test("weekly report becomes due on the configured local weekday", () => {
  assert.deepEqual(dueReportTypes(new Date("2026-10-25T17:00:00Z"), settings), ["daily", "weekly"]);
});

test("monthly report is due on the last local day of a month", () => {
  assert.deepEqual(dueReportTypes(new Date("2026-10-31T17:00:00Z"), settings), ["daily", "monthly"]);
});
