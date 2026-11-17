const mongoose = require("mongoose");

const EMAIL_STATUSES = ["queued", "sending", "sent", "delivered", "failed", "simulated"];
const EMAIL_TEMPLATES = ["booking_approved", "booking_rejected", "booking_rescheduled"];
const emailAttemptSchema = new mongoose.Schema({
  attempt: { type: Number, required: true },
  attemptedAt: { type: Date, required: true },
  status: { type: String, enum: EMAIL_STATUSES, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  providerMessageId: { type: String },
}, { _id: false });

const emailNotificationSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true },
    template: { type: String, enum: EMAIL_TEMPLATES, required: true },
    status: { type: String, enum: EMAIL_STATUSES, required: true, default: "queued" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastAttemptBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String },
    html: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    attempts: { type: Number, default: 0 },
    providerMessageId: { type: String },
    error: { type: String },
    sentAt: { type: Date },
    lastAttemptAt: { type: Date },
    attemptHistory: { type: [emailAttemptSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

emailNotificationSchema.index({ status: 1, createdAt: -1 });
emailNotificationSchema.index({ booking: 1 });

emailNotificationSchema.statics.EMAIL_STATUSES = EMAIL_STATUSES;
emailNotificationSchema.statics.EMAIL_TEMPLATES = EMAIL_TEMPLATES;

module.exports = mongoose.model("EmailNotification", emailNotificationSchema);
