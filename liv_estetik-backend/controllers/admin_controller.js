const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Service = require("../models/service");
const TimeSlot = require("../models/timeslot");
const Testimonial = require("../models/testimonial");
const Booking = require("../models/booking");
const EmailNotification = require("../models/email_notification");
const AuditLog = require("../models/audit_log");
const Message = require("../models/message");
const ClinicSettings = require("../models/clinic_settings");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const { logAction } = require("../service/audit_service");
const { retryEmailNotification } = require("../service/email_service");
const { releaseSlot } = require("../service/slot_service");
const { generateSlotsForNextDays } = require("../service/slot_generator");

const getClinicSettings = asyncHandler(async (_req, res) => {
  let settings = await ClinicSettings.findOne({ key: "clinic" });
  if (!settings) settings = await ClinicSettings.create({ key: "clinic" });
  res.json({ data: settings });
});

const updateClinicSettings = asyncHandler(async (req, res) => {
  const settings = await ClinicSettings.findOneAndUpdate(
    { key: "clinic" }, { $set: req.body }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await logAction({ actor: req.user, action: "clinic.settings_updated", entityType: "ClinicSettings", entityId: settings._id, metadata: { operatingWindowCount: settings.operatingWindows.length, breakCount: settings.breaks.length, blockedDateCount: settings.blockedLocalDates.length } });
  res.json({ data: settings });
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

// GET /api/admin/dashboard
const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalServices,
    pendingBookings,
    approvedBookings,
    failedEmails,
    newMessages,
  ] = await Promise.all([
    User.countDocuments({}),
    Service.countDocuments({}),
    Booking.countDocuments({ status: "pending" }),
    Booking.countDocuments({ status: "approved" }),
    EmailNotification.countDocuments({ status: "failed" }),
    Message.countDocuments({ status: "new" }),
  ]);

  res.json({
    data: {
      totalUsers,
      totalServices,
      pendingBookings,
      approvedBookings,
      failedEmails,
      newMessages,
    },
  });
});

// ---------------------------------------------------------------------------
// Users (reception/admin accounts)
// ---------------------------------------------------------------------------

// GET /api/admin/users
const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ data: users });
});

// POST /api/admin/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, active } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    phone,
    active,
  });

  await logAction({
    actor: req.user,
    action: "user.created",
    entityType: "User",
    entityId: user._id,
    metadata: { role },
  });

  res.status(201).json({ data: user });
});

// PATCH /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const { name, email, password, role, phone, active } = req.body;

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict("A user with this email already exists");
    user.email = email.toLowerCase();
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (active !== undefined) {
    user.active = active;
    if (active === false) {
      await logAction({
        actor: req.user,
        action: "user.deactivated",
        entityType: "User",
        entityId: user._id,
      });
    }
  }
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();
  res.json({ data: user });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw ApiError.badRequest("You cannot delete your own account");
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  await logAction({
    actor: req.user,
    action: "user.deleted",
    entityType: "User",
    entityId: user._id,
  });

  res.json({ message: "User deleted" });
});

// POST /api/admin/users/:id/reset-password
const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  
  if (user._id.toString() === req.user.id) {
    throw ApiError.badRequest("You cannot reset your own password via this endpoint. Use the account settings instead.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await logAction({
    actor: req.user,
    action: "user.password_reset",
    entityType: "User",
    entityId: user._id,
    metadata: { resetFor: user.email },
  });

  res.json({
    message: `Password reset for ${user.email}`,
    data: user,
  });
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

// GET /api/admin/services
const listServices = asyncHandler(async (_req, res) => {
  const services = await Service.find({}).sort({ sortOrder: 1 });
  res.json({ data: services });
});

// POST /api/admin/services
const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  const serviceObj = service.toObject();
  // eslint-disable-next-line no-console
  console.log(`[service] created: ${service.name} (id=${service._id}, active=${service.active}, max=${service.maxAppointmentsPerDay})`);
  // eslint-disable-next-line no-console
  console.log(`[service] saved object:`, JSON.stringify(serviceObj, null, 2));

  await logAction({
    actor: req.user,
    action: "service.created",
    entityType: "Service",
    entityId: service._id,
  });

  // Trigger slot generation in the background (non-blocking)
  generateSlotsForNextDays(7)
    .then((result) => {
      // eslint-disable-next-line no-console
      console.log(`[slot-generator] generated slots after service creation:`, result);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[slot-generator] failed to generate slots after service creation:", err);
    });

  res.status(201).json({ data: serviceObj });
});

// PATCH /api/admin/services/:id
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) throw ApiError.notFound("Service not found");

  await logAction({
    actor: req.user,
    action: "service.updated",
    entityType: "Service",
    entityId: service._id,
    metadata: req.body,
  });

  res.json({ data: service });
});

// DELETE /api/admin/services/:id
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw ApiError.notFound("Service not found");

  await logAction({
    actor: req.user,
    action: "service.deleted",
    entityType: "Service",
    entityId: service._id,
  });

  res.json({ message: "Service deleted" });
});

// ---------------------------------------------------------------------------
// Time slots
// ---------------------------------------------------------------------------

// GET /api/admin/time-slots
const listTimeSlots = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = new Date(from);
    if (to) filter.startsAt.$lte = new Date(to);
  }
  const slots = await TimeSlot.find(filter).sort({ startsAt: 1 }).populate('service', 'name');
  res.json({ data: slots });
});

// POST /api/admin/time-slots
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

// PATCH /api/admin/time-slots/:id
const updateTimeSlot = asyncHandler(async (req, res) => {
  const slot = await TimeSlot.findById(req.params.id);
  if (!slot) throw ApiError.notFound("Time slot not found");

  Object.assign(slot, req.body, { updatedBy: req.user.id });
  await slot.save();

  await logAction({
    actor: req.user,
    action: "slot.updated",
    entityType: "TimeSlot",
    entityId: slot._id,
    metadata: req.body,
  });

  res.json({ data: slot });
});

// DELETE /api/admin/time-slots/:id
const deleteTimeSlot = asyncHandler(async (req, res) => {
  const slot = await TimeSlot.findById(req.params.id);
  if (!slot) throw ApiError.notFound("Time slot not found");

  if (slot.bookedCount > 0) {
    throw ApiError.conflict(
      "Cannot delete a time slot that has active bookings. Reject or reschedule the booking first."
    );
  }

  await slot.deleteOne();

  await logAction({
    actor: req.user,
    action: "slot.deleted",
    entityType: "TimeSlot",
    entityId: slot._id,
  });

  res.json({ message: "Time slot deleted" });
});

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

// GET /api/admin/testimonials
const listTestimonials = asyncHandler(async (_req, res) => {
  const testimonials = await Testimonial.find({}).sort({ sortOrder: 1 });
  res.json({ data: testimonials });
});

// POST /api/admin/testimonials
const createTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  await logAction({
    actor: req.user,
    action: "testimonial.created",
    entityType: "Testimonial",
    entityId: testimonial._id,
  });
  res.status(201).json({ data: testimonial });
});

// PATCH /api/admin/testimonials/:id
const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!testimonial) throw ApiError.notFound("Testimonial not found");

  await logAction({
    actor: req.user,
    action: "testimonial.updated",
    entityType: "Testimonial",
    entityId: testimonial._id,
    metadata: req.body,
  });

  res.json({ data: testimonial });
});

// DELETE /api/admin/testimonials/:id
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) throw ApiError.notFound("Testimonial not found");

  await logAction({
    actor: req.user,
    action: "testimonial.deleted",
    entityType: "Testimonial",
    entityId: testimonial._id,
  });

  res.json({ message: "Testimonial deleted" });
});

// ---------------------------------------------------------------------------
// Bookings (admin has full access, including hard delete)
// ---------------------------------------------------------------------------

// GET /api/admin/bookings
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  res.json({ data: bookings, meta: { total, page: Number(page), limit: Number(limit) } });
});

// GET /api/admin/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("service", "name category")
    .populate("requestedSlot")
    .populate("approvedSlot");
  if (!booking) throw ApiError.notFound("Booking not found");
  res.json({ data: booking });
});

// DELETE /api/admin/bookings/:id  (hard delete, admin only)
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Booking not found");

  if (["pending", "approved", "reschedule_requested"].includes(booking.status)) {
    const slotToRelease = booking.approvedSlot || booking.requestedSlot;
    await releaseSlot(slotToRelease);
  }

  await booking.deleteOne();

  await logAction({
    actor: req.user,
    action: "booking.deleted",
    entityType: "Booking",
    entityId: booking._id,
  });

  res.json({ message: "Booking deleted" });
});

// ---------------------------------------------------------------------------
// Email notifications & audit logs (read-only + retry)
// ---------------------------------------------------------------------------

// GET /api/admin/email-notifications
const listEmailNotifications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total] = await Promise.all([
    EmailNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    EmailNotification.countDocuments(filter),
  ]);

  res.json({ data: notifications, meta: { total, page: Number(page), limit: Number(limit) } });
});

// PATCH /api/admin/email-notifications/:id/retry
const retryEmail = asyncHandler(async (req, res) => {
  const record = await retryEmailNotification(req.params.id);
  if (!record) throw ApiError.notFound("Email notification not found");

  await logAction({
    actor: req.user,
    action: "email.retried",
    entityType: "EmailNotification",
    entityId: record._id,
  });

  res.json({ data: record });
});

// GET /api/admin/audit-logs
const listAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (entityType) filter.entityType = entityType;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actor", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ data: logs, meta: { total, page: Number(page), limit: Number(limit) } });
});

module.exports = {
  getDashboard,
  getClinicSettings,
  updateClinicSettings,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  listServices,
  createService,
  updateService,
  deleteService,
  listTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  listBookings,
  getBooking,
  deleteBooking,
  listEmailNotifications,
  retryEmail,
  listAuditLogs,
};
