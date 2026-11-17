const test = require("node:test");
const assert = require("node:assert/strict");
const { isSlotWithinSettings } = require("../service/clinic_settings_service");

const settings = {
  operatingWindows: [{ dayOfWeek: 1, startMinute: 540, endMinute: 1020 }],
  breaks: [],
  blockedLocalDates: [],
  operatingExceptions: [],
};

test("regular weekly hours use Addis Ababa local time", () => {
  assert.equal(isSlotWithinSettings(new Date("2026-11-16T06:00:00Z"), new Date("2026-11-16T07:00:00Z"), settings), true);
  assert.equal(isSlotWithinSettings(new Date("2026-11-16T04:00:00Z"), new Date("2026-11-16T05:00:00Z"), settings), false);
});

test("one-off open hours override weekly closure and closed dates", () => {
  const special = { ...settings, blockedLocalDates: ["2026-11-21"], operatingExceptions: [{ localDate: "2026-11-21", closed: false, startMinute: 600, endMinute: 720 }] };
  assert.equal(isSlotWithinSettings(new Date("2026-11-21T07:00:00Z"), new Date("2026-11-21T08:00:00Z"), special), true);
  assert.equal(isSlotWithinSettings(new Date("2026-11-21T06:00:00Z"), new Date("2026-11-21T07:00:00Z"), special), false);
});

test("one-off closure overrides regular opening hours", () => {
  const special = { ...settings, operatingExceptions: [{ localDate: "2026-11-16", closed: true }] };
  assert.equal(isSlotWithinSettings(new Date("2026-11-16T06:00:00Z"), new Date("2026-11-16T07:00:00Z"), special), false);
});
