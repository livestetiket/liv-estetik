const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    initials: { type: String, required: true, trim: true },
    service: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);