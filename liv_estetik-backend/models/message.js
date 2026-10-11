const mongoose = require("mongoose");

const MESSAGE_STATUSES = ["new", "read", "replied", "archived"];

const messageSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true },
    status: { type: String, enum: MESSAGE_STATUSES, required: true, default: "new" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    internalNotes: { type: String },
  },
  { timestamps: true }
);

messageSchema.index({ status: 1, createdAt: -1 });

messageSchema.statics.MESSAGE_STATUSES = MESSAGE_STATUSES;

module.exports = mongoose.model("Message", messageSchema);