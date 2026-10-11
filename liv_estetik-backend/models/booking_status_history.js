const mongoose = require("mongoose");

const bookingStatusHistorySchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedByRole: { type: String, enum: ["reception", "admin", null] },
    message: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookingStatusHistorySchema.index({ booking: 1, createdAt: 1 });

module.exports = mongoose.model("BookingStatusHistory", bookingStatusHistorySchema);