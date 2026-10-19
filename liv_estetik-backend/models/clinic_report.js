const mongoose = require("mongoose");

const clinicReportSchema = new mongoose.Schema({
  type: { type: String, enum: ["daily", "weekly", "monthly", "custom"], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  generatedAt: { type: Date, required: true, default: Date.now },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  trigger: { type: String, enum: ["manual", "scheduled"], default: "manual" },
  status: { type: String, enum: ["generated", "failed"], default: "generated" },
  dataCompleteness: { type: String, enum: ["complete", "partial"], default: "partial" },
  metrics: { type: mongoose.Schema.Types.Mixed, required: true },
  shareOpenedAt: { type: Date },
  shareOpenedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  scheduleKey: { type: String },
}, { timestamps: true });

clinicReportSchema.index({ type: 1, periodStart: -1, generatedAt: -1 });
clinicReportSchema.index({ scheduleKey: 1 }, { unique: true, partialFilterExpression: { scheduleKey: { $type: "string" } } });

module.exports = mongoose.model("ClinicReport", clinicReportSchema);
