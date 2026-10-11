const mongoose = require("mongoose");

const SOURCES = ["booking", "contact", "manual", "import"];

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    age: { type: Number },
    sex: { type: String, trim: true },
    address: { type: String, trim: true },
    hasAccount: { type: Boolean, default: false },
    source: { type: String, enum: SOURCES, required: true, default: "manual" },
    notes: { type: String },
  },
  { timestamps: true }
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });

customerSchema.statics.SOURCES = SOURCES;

module.exports = mongoose.model("Customer", customerSchema);