const test = require("node:test");
const assert = require("node:assert/strict");
const { getPeriod, TZ } = require("../service/reporting_service");

test("reporting uses the Addis Ababa timezone and local daily boundaries", () => {
  const period = getPeriod("daily", { date: "2026-10-19" });
  assert.equal(TZ, "Africa/Addis_Ababa");
  assert.equal(period.start.toISOString(), "2026-10-18T21:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-10-19T21:00:00.000Z");
  assert.equal(period.label, "2026-10-19 – 2026-10-19");
});

test("weekly periods run Monday through Sunday in Addis Ababa", () => {
  const period = getPeriod("weekly", { date: "2026-10-21" });
  assert.equal(period.label, "2026-10-19 – 2026-10-25");
  assert.equal(period.end.getTime() - period.start.getTime(), 7 * 86400000);
});

test("monthly periods include the full local calendar month", () => {
  const period = getPeriod("monthly", { month: "2026-02" });
  assert.equal(period.label, "2026-02-01 – 2026-02-28");
  assert.equal(period.end.getTime() - period.start.getTime(), 28 * 86400000);
  assert.equal(period.previousStart.toISOString(), "2025-12-31T21:00:00.000Z");
});

test("custom range includes its final local calendar day", () => {
  const period = getPeriod("custom", { from: "2026-12-31", to: "2027-01-01" });
  assert.equal(period.label, "2026-12-31 – 2027-01-01");
  assert.equal(period.end.toISOString(), "2027-01-01T21:00:00.000Z");
});

test("invalid and reversed custom ranges are rejected", () => {
  assert.throws(() => getPeriod("custom", { from: "2026-02-30", to: "2026-03-01" }), /not valid/);
  assert.throws(() => getPeriod("custom", { from: "2026-03-02", to: "2026-03-01" }), /valid inclusive/);
});
