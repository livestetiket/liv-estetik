const Booking = require("../models/booking");
const BookingStatusHistory = require("../models/booking_status_history");
const EmailNotification = require("../models/email_notification");
const Message = require("../models/message");
const TimeSlot = require("../models/timeslot");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const bookingService = require("../service/booking_service");
const { logAction } = require("../service/audit_service");

// GET /api/reception/dashboard
const getDashboard = asyncHandler(async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [pending, approvedToday, rejectedThisWeek, rescheduled, newMessages] = await Promise.all([
    Booking.countDocuments({ status: "pending" }),
    Booking.countDocuments({
      status: "approved",
      decisionAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Booking.countDocuments({ status: "rejected", decisionAt: { $gte: startOfWeek } }),
    Booking.countDocuments({ status: { $in: ["reschedule_requested", "rescheduled"] } }),
    Message.countDocuments({ status: "new" }),
  ]);

  res.json({
    data: {
      pendingBookingRequests: pending,
      approvedAppointmentsToday: approvedToday,
      rejectedRequestsThisWeek: rejectedThisWeek,
      rescheduledRequests: rescheduled,
      newContactMessages: newMessages,
    },
  });
});

// GET /api/reception/bookings
const listBookings = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("service", "name category")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  res.json({ data: bookings, meta: { total, page: Number(page), limit: Number(limit) } });
});

// GET /api/reception/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("service", "name category")
    .populate("assignedTo", "name")
    .populate("approvedBy", "name")
    .populate("rejectedBy", "name")
    .populate("rescheduledBy", "name")
    .populate("requestedSlot")
    .populate("approvedSlot");

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  const [history, emails] = await Promise.all([
    BookingStatusHistory.find({ booking: booking._id })
      .populate("changedBy", "name")
      .sort({ createdAt: 1 }),
    EmailNotification.find({ booking: booking._id }).sort({ createdAt: -1 }),
  ]);

  res.json({ data: { booking, history, emails } });
});

// PATCH /api/reception/bookings/:id/approve
const approveBooking = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const result = await bookingService.approveBooking({
    bookingId: req.params.id,
    staffMessage: message,
    actor: req.user,
  });
  respondWithEmailWarning(res, result);
});

// PATCH /api/reception/bookings/:id/reject
const rejectBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const result = await bookingService.rejectBooking({
    bookingId: req.params.id,
    reason,
    actor: req.user,
  });
  respondWithEmailWarning(res, result);
});

// PATCH /api/reception/bookings/:id/reschedule
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { newSlot, reason } = req.body;
  const result = await bookingService.rescheduleBooking({
    bookingId: req.params.id,
    newSlotId: newSlot,
    reason,
    actor: req.user,
  });
  respondWithEmailWarning(res, result);
});

// PATCH /api/reception/bookings/:id/complete
const completeBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking({ bookingId: req.params.id, actor: req.user });
  res.json({ data: booking });
});

// PATCH /api/reception/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking({
    bookingId: req.params.id,
    reason: req.body.reason,
    actor: req.user,
  });
  res.json({ data: booking });
});

// PATCH /api/reception/bookings/:id/note
const addNote = asyncHandler(async (req, res) => {
  const booking = await bookingService.addInternalNote({
    bookingId: req.params.id,
    note: req.body.note,
    actor: req.user,
  });
  res.json({ data: booking });
});

function respondWithEmailWarning(res, { booking, emailRecord }) {
  const payload = { data: booking };
  if (emailRecord.status === "failed") {
    payload.warning = "The status was updated, but the notification email failed to send.";
    payload.emailError = emailRecord.error;
  }
  res.json(payload);
}

// GET /api/reception/messages
const listMessages = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const messages = await Message.find(filter).sort({ createdAt: -1 });
  res.json({ data: messages });
});

// PATCH /api/reception/messages/:id
const updateMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound("Message not found");

  Object.assign(message, req.body);
  await message.save();

  await logAction({
    actor: req.user,
    action: "message.status_updated",
    entityType: "Message",
    entityId: message._id,
  });

  res.json({ data: message });
});

// POST /api/reception/time-slots
const createTimeSlot = asyncHandler(async (req, res) => {
  const slot = await TimeSlot.create({ ...req.body, createdBy: req.user.id });
  await logAction({
    actor: req.user,
    action: "slot.created",
    entityType: "TimeSlot",
    entityId: slot._id,
  });
  res.status(201).json({ data: slot });
});

// GET /api/reception/time-slots
const listTimeSlots = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = new Date(from);
    if (to) filter.startsAt.$lte = new Date(to);
  }
  const slots = await TimeSlot.find(filter).sort({ startsAt: 1 });
  res.json({ data: slots });
});

// PATCH /api/reception/time-slots/:id/block
const blockSlot = asyncHandler(async (req, res) => {
  const slot = await TimeSlot.findById(req.params.id);
  if (!slot) throw ApiError.notFound("Time slot not found");

  slot.status = "blocked";
  slot.blockedReason = req.body.reason;
  slot.updatedBy = req.user.id;
  await slot.save();

  await logAction({
    actor: req.user,
    action: "slot.blocked",
    entityType: "TimeSlot",
    entityId: slot._id,
    metadata: { reason: req.body.reason },
  });

  res.json({ data: slot });
});

// PATCH /api/reception/time-slots/:id/unblock
const unblockSlot = asyncHandler(async (req, res) => {
  const slot = await TimeSlot.findById(req.params.id);
  if (!slot) throw ApiError.notFound("Time slot not found");
  if (slot.status !== "blocked") {
    throw ApiError.badRequest("Slot is not currently blocked");
  }

  slot.status = slot.bookedCount >= slot.capacity ? "reserved" : "available";
  slot.blockedReason = undefined;
  slot.updatedBy = req.user.id;
  await slot.save();

  await logAction({
    actor: req.user,
    action: "slot.unblocked",
    entityType: "TimeSlot",
    entityId: slot._id,
  });

  res.json({ data: slot });
});

module.exports = {
  getDashboard,
  listBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  rescheduleBooking,
  completeBooking,
  cancelBooking,
  addNote,
  listMessages,
  createTimeSlot,
  updateMessage,
  listTimeSlots,
  blockSlot,
  unblockSlot,
};