const mongoose = require("mongoose");

const operatingWindowSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  startMinute: { type: Number, min: 0, max: 1439, required: true },
  endMinute: { type: Number, min: 1, max: 1440, required: true },
}, { _id: false });

const breakSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80, default: "Break" },
  startMinute: { type: Number, min: 0, max: 1439, required: true },
  endMinute: { type: Number, min: 1, max: 1440, required: true },
}, { _id: false });

const clinicSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "clinic" },
  timezone: { type: String, required: true, default: "Africa/Addis_Ababa", immutable: true },
  operatingWindows: { type: [operatingWindowSchema], default: [
    { dayOfWeek: 1, startMinute: 540, endMinute: 1050 },
    { dayOfWeek: 2, startMinute: 540, endMinute: 1050 },
    { dayOfWeek: 3, startMinute: 540, endMinute: 1050 },
    { dayOfWeek: 4, startMinute: 540, endMinute: 1050 },
    { dayOfWeek: 5, startMinute: 540, endMinute: 1050 },
    { dayOfWeek: 6, startMinute: 540, endMinute: 750 },
  ] },
  breaks: { type: [breakSchema], default: [] },
  blockedLocalDates: { type: [String], default: [] },
  reportSchedulesEnabled: { type: Boolean, default: false },
  reportDailyTime: { type: String, default: "20:00" },
  reportWeeklyDay: { type: Number, min: 0, max: 6, default: 0 },
  reportWeeklyTime: { type: String, default: "20:00" },
  reportMonthlyTime: { type: String, default: "20:00" },
}, { timestamps: true });

module.exports = mongoose.model("ClinicSettings", clinicSettingsSchema);
