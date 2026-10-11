const mongoose = require("mongoose");

const SLOT_STATUSES = ["available", "unavailable", "reserved", "blocked"];

const timeSlotSchema = new mongoose.Schema(
  {
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: SLOT_STATUSES,
      required: true,
      default: "available",
    },
    capacity: { type: Number, required: true, min: 1, default: 1 },
    bookedCount: { type: Number, required: true, default: 0, min: 0 },
    blockedReason: { type: String },
    // Link the slot to a specific service so generation and booking are automated
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

timeSlotSchema.index({ startsAt: 1 });
// Compound index to avoid duplicate slots for the same service at the same time.
// NOTE: Make sure existing duplicates are removed (run scripts/dedupe_timeslots.js)
// before creating a unique index in production. Index creation will fail if
// duplicates exist on the collection.
timeSlotSchema.index({ service: 1, startsAt: 1 }, { unique: true });
timeSlotSchema.index({ status: 1 });

timeSlotSchema.pre("validate", function validateRange(next) {
  if (this.endsAt && this.startsAt && this.endsAt <= this.startsAt) {
    return next(new Error("endsAt must be after startsAt"));
  }
  next();
});

// Derived flag the public frontend uses to disable clicks.
timeSlotSchema.virtual("selectable").get(function selectable() {
  return this.status === "available" && this.bookedCount < this.capacity;
});

timeSlotSchema.set("toJSON", { virtuals: true });

timeSlotSchema.statics.SLOT_STATUSES = SLOT_STATUSES;

module.exports = mongoose.model("TimeSlot", timeSlotSchema);