const mongoose = require("mongoose");
const Sequence = require("./sequence");

const SOURCES = ["booking", "contact", "manual", "import"];

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    normalizedPhone: { type: String, trim: true, index: true, sparse: true },
    normalizedEmail: { type: String, trim: true, lowercase: true, index: true, sparse: true },
    cardNumber: { type: String, trim: true, unique: true, sparse: true, immutable: true },
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

customerSchema.pre("save", async function assignPatientCardNumber() {
  if (!this.isNew || this.cardNumber) return;
  const year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Africa/Addis_Ababa" }).format(new Date()));
  for (;;) {
    const sequence = await Sequence.findOneAndUpdate(
      { key: `patient-card-${year}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const candidate = `LE-${year}-${String(sequence.value).padStart(6, "0")}`;
    if (!await this.constructor.exists({ cardNumber: candidate })) {
      this.cardNumber = candidate;
      return;
    }
  }
});

customerSchema.statics.SOURCES = SOURCES;

module.exports = mongoose.model("Customer", customerSchema);
