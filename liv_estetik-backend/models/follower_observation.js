const mongoose = require("mongoose");

const followerObservationSchema = new mongoose.Schema({
  platform: { type: String, enum: ["tiktok", "instagram", "facebook", "youtube"], required: true },
  count: { type: Number, required: true, min: 0 },
  observedAt: { type: Date, required: true, default: Date.now },
  source: { type: String, enum: ["manual", "api"], required: true, default: "manual" },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

followerObservationSchema.index({ platform: 1, observedAt: -1 });

module.exports = mongoose.model("FollowerObservation", followerObservationSchema);
