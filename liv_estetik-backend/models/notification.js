const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  eventKey: { type: String, required: true },
  eventType: { type: String, required: true, index: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 500 },
  entityType: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  readAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

notificationSchema.index({ recipient: 1, eventKey: 1 }, { unique: true });
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
module.exports = mongoose.model("Notification", notificationSchema);
