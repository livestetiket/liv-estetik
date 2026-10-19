const Service = require("../models/service");
const Testimonial = require("../models/testimonial");
const TimeSlot = require("../models/timeslot");
const Message = require("../models/message");
const asyncHandler = require("../util/async_handler");
const { createBookingRequest } = require("../service/booking_service");
const { findOrCreateCustomer } = require("../service/customer_service");
const { getClinicSettings, isSlotWithinSettings } = require("../service/clinic_settings_service");

// GET /api/services
const getServices = asyncHandler(async (_req, res) => {
  const services = await Service.find({ visible: true }).sort({ sortOrder: 1 });
  res.json({ data: services });
});

// GET /api/testimonials
const getTestimonials = asyncHandler(async (_req, res) => {
  const testimonials = await Testimonial.find({ active: true }).sort({ sortOrder: 1 });
  res.json({ data: testimonials });
});

// GET /api/time-slots?from=&to=&serviceIds=...
const getTimeSlots = asyncHandler(async (req, res) => {
  const { from, to, serviceIds } = req.query;

  const filter = {};
  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = new Date(from);
    if (to) filter.startsAt.$lte = new Date(to);
  }

  if (serviceIds) {
    const ids = Array.isArray(serviceIds)
      ? serviceIds.flatMap((value) => String(value).split(",").map((item) => item.trim()).filter(Boolean))
      : String(serviceIds).split(",").map((item) => item.trim()).filter(Boolean);
    if (ids.length > 0) {
      filter.service = { $in: ids };
    }
  }

  const slots = await TimeSlot.find(filter).sort({ startsAt: 1 }).populate("service", "name");
  const settings = await getClinicSettings();
  const allowedSlots = slots.filter((slot) => slot.status === "available" && slot.bookedCount < slot.capacity && isSlotWithinSettings(slot.startsAt, slot.endsAt, settings));

  res.json({ data: allowedSlots });
});

// POST /api/bookings
const createBooking = asyncHandler(async (req, res) => {
  const booking = await createBookingRequest(req.body);
  res.status(201).json({
    message: "Booking request received. Our team will review it shortly.",
    data: {
      _id: booking._id,
      status: booking.status,
    },
  });
});

// POST /api/messages
const createMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  const customer = await findOrCreateCustomer({
    fullName: name,
    email,
    source: "contact",
  });

  const created = await Message.create({
    customer: customer._id,
    name,
    email,
    message,
    status: "new",
  });

  res.status(201).json({
    message: "Your message has been received. We'll get back to you soon.",
    data: { _id: created._id },
  });
});

module.exports = { getServices, getTestimonials, getTimeSlots, createBooking, createMessage };
