const mongoose = require("mongoose");

const CATEGORIES = ["Hair", "Skin / Anti-aging", "Body"];

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String },
    icon: { type: String },
    active: { type: Boolean, default: true }, // bookable
    visible: { type: Boolean, default: true }, // shown publicly
    isComingSoon: { type: Boolean, default: false }, // explicitly marked as coming soon
    estimatedDurationMinutes: { type: Number, required: true, min: 1 },
    // Maximum number of appointments for this service per calendar day.
    // The automatic slot generator will create up to this many slots per day.
    maxAppointmentsPerDay: { type: Number, required: true, min: 0, default: 1 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ visible: 1, sortOrder: 1 });
serviceSchema.index({ active: 1 });

// visible + inactive => "coming soon" in the frontend, not bookable
serviceSchema.virtual("comingSoon").get(function comingSoon() {
  return this.visible && !this.active;
});

serviceSchema.set("toJSON", { virtuals: true });

serviceSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("Service", serviceSchema);