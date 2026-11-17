const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
}, { versionKey: false });

module.exports = mongoose.model("Sequence", sequenceSchema);
