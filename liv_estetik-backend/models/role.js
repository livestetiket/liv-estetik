const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, match: /^[a-z0-9_]+$/ },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300, default: "" },
  permissions: { type: [String], default: [] },
  active: { type: Boolean, default: true },
}, { timestamps: true });

roleSchema.index({ active: 1, key: 1 });
module.exports = mongoose.model("Role", roleSchema);
