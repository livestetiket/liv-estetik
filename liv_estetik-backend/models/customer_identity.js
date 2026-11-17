const mongoose = require("mongoose");

const customerIdentitySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("CustomerIdentity", customerIdentitySchema);
