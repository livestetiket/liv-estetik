const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, trim: true, maxlength: 160 },
    actorRole: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "booking.approved"
    entityType: { type: String, required: true }, // e.g. "Booking"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
    requestId: { type: String, trim: true, maxlength: 120 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ actor: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
