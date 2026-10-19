const mongoose = require("mongoose");

const socialPostSchema = new mongoose.Schema({
  platform: { type: String, enum: ["tiktok", "instagram", "facebook", "youtube"], required: true },
  postUrl: { type: String, trim: true },
  platformPostId: { type: String, trim: true },
  publishedAt: { type: Date, required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

socialPostSchema.index({ platform: 1, publishedAt: -1 });
socialPostSchema.index({ postUrl: 1 }, { unique: true, sparse: true });
socialPostSchema.index({ platform: 1, platformPostId: 1 }, { unique: true, partialFilterExpression: { platformPostId: { $type: "string" } } });

module.exports = mongoose.model("SocialPost", socialPostSchema);
