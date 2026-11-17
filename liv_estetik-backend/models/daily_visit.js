const mongoose = require("mongoose");

const dailyVisitSchema = new mongoose.Schema({
  visitDate: { type: Date, required: true, index: true },
  cardNumber: { type: String, trim: true, maxlength: 40 },
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  serviceName: { type: String, required: true, trim: true, maxlength: 120 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

dailyVisitSchema.index({ visitDate: -1, createdAt: -1 });
module.exports = mongoose.model("DailyVisit", dailyVisitSchema);
