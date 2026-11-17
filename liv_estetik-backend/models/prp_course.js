const mongoose = require("mongoose");

const sessionHistorySchema = new mongoose.Schema({
  sessionNumber: { type: Number, min: 1, max: 6, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  changedAt: { type: Date, required: true, default: Date.now },
  previous: { date: Date, completed: Boolean },
  updated: { date: Date, completed: Boolean },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionNumber: { type: Number, min: 1, max: 6, required: true },
  treatmentDate: { type: Date },
  completed: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
}, { timestamps: true });

const prpCourseSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  courseNumber: { type: Number, required: true },
  title: { type: String, trim: true, maxlength: 120, default: "PRP treatment course" },
  sessions: {
    type: [sessionSchema],
    validate: {
      validator: (sessions) => sessions.length === 6 && new Set(sessions.map((session) => session.sessionNumber)).size === 6,
      message: "A PRP course must contain exactly six unique sessions.",
    },
    required: true,
  },
  history: { type: [sessionHistorySchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

prpCourseSchema.index({ patient: 1, courseNumber: 1 }, { unique: true });
module.exports = mongoose.model("PrpCourse", prpCourseSchema);
