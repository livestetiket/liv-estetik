const mongoose = require("mongoose");

const EMAIL_STATUSES = ["queued", "sent", "failed"];
const EMAIL_TEMPLATES = ["booking_approved", "booking_rejected", "booking_rescheduled"];

const emailNotificationSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true },
    template: { type: String, enum: EMAIL_TEMPLATES, required: true },
    status: { type: String, enum: EMAIL_STATUSES, required: true, default: "queued" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    message: { type: String },
    providerMessageId: { type: String },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailNotificationSchema.index({ status: 1, createdAt: -1 });
emailNotificationSchema.index({ booking: 1 });

emailNotificationSchema.statics.EMAIL_STATUSES = EMAIL_STATUSES;
emailNotificationSchema.statics.EMAIL_TEMPLATES = EMAIL_TEMPLATES;

module.exports = mongoose.model("EmailNotification", emailNotificationSchema);