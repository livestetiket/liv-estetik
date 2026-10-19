const mongoose = require("mongoose");

const callActivitySchema = new mongoose.Schema({
  direction: { type: String, enum: ["inbound", "outbound"], required: true },
  phone: { type: String, trim: true },
  purpose: { type: String, required: true, trim: true, maxlength: 120 },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  outcome: { type: String, enum: ["booking_created", "consultation_inquiry", "follow_up", "information_provided", "no_answer", "unsuccessful", "other"], required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  followUpRequired: { type: Boolean, default: false },
  followUpAt: { type: Date },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String, trim: true, maxlength: 2000 },
  loggedAt: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

callActivitySchema.index({ loggedAt: -1 });
callActivitySchema.index({ staff: 1, loggedAt: -1 });
callActivitySchema.index({ followUpRequired: 1, followUpAt: 1 });

module.exports = mongoose.model("CallActivity", callActivitySchema);
