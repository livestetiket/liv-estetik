const mongoose = require("mongoose");

const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "reschedule_requested",
  "rescheduled",
  "completed",
  "cancelled",
];

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },

    // Snapshot of what the customer submitted, kept even if Customer record changes later.
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    sex: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    serviceName: { type: String }, // snapshot of service name

    requestedSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    requestedStartsAt: { type: Date, required: true },
    requestedEndsAt: { type: Date, required: true },

    approvedSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },
    approvedStartsAt: { type: Date },
    approvedEndsAt: { type: Date },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      required: true,
      default: "pending",
    },

    customerNotes: { type: String, maxlength: 2000 },
    staffMessage: { type: String },
    internalNotes: { type: String },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    decisionAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ requestedSlot: 1 });

bookingSchema.statics.BOOKING_STATUSES = BOOKING_STATUSES;

module.exports = mongoose.model("Booking", bookingSchema);