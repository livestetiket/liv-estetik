const mongoose = require("mongoose");

const { BUILTIN_ROLES } = require("../service/permissions");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true },
    isPrimaryAdmin: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ active: 1 });

// Never leak the password hash in API responses.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

userSchema.statics.ROLES = BUILTIN_ROLES;

module.exports = mongoose.model("User", userSchema);
