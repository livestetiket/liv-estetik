const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Service = require("../models/service");
const TimeSlot = require("../models/timeslot");
const BookingStatusHistory = require("../models/booking_status_history");
const ApiError = require("../util/api_error");
const { findOrCreateCustomer } = require("./customer_service");
const { reserveSlot, releaseSlot, assertSlotSelectable } = require("./slot_service");
const { sendBookingEmail } = require("./email_service");
const { logAction } = require("./audit_service");

async function recordStatusChange({ bookingId, fromStatus, toStatus, changedBy, changedByRole, message }) {
  await BookingStatusHistory.create({
    booking: bookingId,
    fromStatus,
    toStatus,
    changedBy: changedBy || undefined,
    changedByRole: changedByRole || undefined,
    message,
  });
}

/**
 * Creates a new pending booking request from the public booking form.
 * Re-validates service and slot availability server-side, per docs
 * section 6.4 ("never trust only frontend disabled states").
 * Only one service per booking is allowed.
 */
async function createBookingRequest(payload, { actor, source = "website" } = {}) {
  const { fullName, age, sex, phone, address, email, service, requestedSlot, notes } = payload;

  const serviceDoc = await Service.findById(service);
  if (!serviceDoc) {
    throw ApiError.badRequest("The selected service could not be found");
  }
  if (!serviceDoc.active) {
    throw ApiError.badRequest(
      `The service "${serviceDoc.name}" is not currently bookable`
    );
  }
  if (serviceDoc.isComingSoon) {
    throw ApiError.badRequest(
      `The service "${serviceDoc.name}" is coming soon and cannot be booked yet`
    );
  }

  const slot = await reserveSlot(requestedSlot);
  let booking;

  try {
    const customer = await findOrCreateCustomer({
      fullName,
      email: email || undefined,
      phone,
      age,
      sex,
      address,
      source: "booking",
    });

    const created = await Booking.create([
      {
        customer: customer._id,
        fullName,
        age,
        sex,
        phone,
        address,
        email: email || undefined,
        source,
        createdBy: actor?.id,
        assignedTo: actor?.id,
        service,
        serviceName: serviceDoc.name,
        requestedSlot: slot._id,
        requestedStartsAt: slot.startsAt,
        requestedEndsAt: slot.endsAt,
        status: "pending",
        customerNotes: notes,
      },
    ]);

    booking = created[0];

    await BookingStatusHistory.create([
      {
        booking: booking._id,
        fromStatus: null,
        toStatus: "pending",
        message: actor ? "Booking created by staff" : "Booking request submitted through the website",
      },
    ]);
  } catch (err) {
    await releaseSlot(requestedSlot).catch(() => {});
    throw err;
  }

  return booking;
}

async function getBookingOr404(id) {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }
  return booking;
}

/**
 * Approves a booking: locks in the requested (or previously proposed) slot,
 * marks it reserved/unavailable, records history, sends the approval email.
 */
async function approveBooking({ bookingId, staffMessage, actor }) {
  const booking = await getBookingOr404(bookingId);

  if (!["pending", "reschedule_requested"].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot approve a booking with status "${booking.status}"`);
  }
  const fromStatus = booking.status;
  booking.status = "approved";
  booking.approvedSlot = booking.requestedSlot;
  booking.approvedStartsAt = booking.requestedStartsAt;
  booking.approvedEndsAt = booking.requestedEndsAt;
  booking.staffMessage = staffMessage;
  booking.approvedBy = actor.id;
  booking.decisionAt = new Date();
  await booking.save();

  await recordStatusChange({
    bookingId: booking._id,
    fromStatus,
    toStatus: "approved",
    changedBy: actor.id,
    changedByRole: actor.role,
    message: staffMessage,
  });

  await logAction({
    actor,
    action: "booking.approved",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { staffMessage },
  });

  const emailRecord = booking.email ? await sendBookingEmail("booking_approved", booking) : { status: "skipped" };

  return { booking, emailRecord };
}

/**
 * Rejects a booking: releases the reserved slot, records history, emails customer.
 */
async function rejectBooking({ bookingId, reason, actor }) {
  const booking = await getBookingOr404(bookingId);

  if (["completed", "cancelled", "rejected"].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot reject a booking with status "${booking.status}"`);
  }

  const fromStatus = booking.status;

  // Release whichever slot was reserved for this booking.
  const slotToRelease = booking.approvedSlot || booking.requestedSlot;
  await releaseSlot(slotToRelease);

  booking.status = "rejected";
  booking.staffMessage = reason;
  booking.rejectedBy = actor.id;
  booking.decisionAt = new Date();
  await booking.save();

  await recordStatusChange({
    bookingId: booking._id,
    fromStatus,
    toStatus: "rejected",
    changedBy: actor.id,
    changedByRole: actor.role,
    message: reason,
  });

  await logAction({
    actor,
    action: "booking.rejected",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { reason },
  });

  const emailRecord = booking.email ? await sendBookingEmail("booking_rejected", booking) : { status: "skipped" };

  return { booking, emailRecord };
}

/**
 * Reschedules a booking to a new slot: releases the old slot, reserves the
 * new one, records history, emails customer with old vs. new time.
 */
async function rescheduleBooking({ bookingId, newSlotId, reason, actor }) {
  const booking = await getBookingOr404(bookingId);

  if (["completed", "cancelled", "rejected"].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot reschedule a booking with status "${booking.status}"`);
  }

  await assertSlotSelectable(newSlotId);

  const previouslyReservedSlot = booking.approvedSlot || booking.requestedSlot;
  let newSlot;

  await releaseSlot(previouslyReservedSlot);

  try {
    newSlot = await reserveSlot(newSlotId);

    const fromStatus = booking.status;
    booking.status = "rescheduled";
    booking.approvedSlot = newSlot._id;
    booking.approvedStartsAt = newSlot.startsAt;
    booking.approvedEndsAt = newSlot.endsAt;
    booking.staffMessage = reason;
    booking.rescheduledBy = actor.id;
    booking.decisionAt = new Date();
    await booking.save();

    await BookingStatusHistory.create([
      {
        booking: booking._id,
        fromStatus,
        toStatus: "rescheduled",
        changedBy: actor.id,
        changedByRole: actor.role,
        message: reason,
      },
    ]);
  } catch (err) {
    if (newSlot) {
      await releaseSlot(newSlot._id).catch(() => {});
    }
    await reserveSlot(previouslyReservedSlot).catch(() => {});
    throw err;
  }

  await logAction({
    actor,
    action: "booking.rescheduled",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { newSlotId, reason },
  });

  const emailRecord = booking.email ? await sendBookingEmail("booking_rescheduled", booking) : { status: "skipped" };

  return { booking, emailRecord };
}

async function completeBooking({ bookingId, actor }) {
  const booking = await getBookingOr404(bookingId);
  if (booking.status !== "approved" && booking.status !== "rescheduled") {
    throw ApiError.badRequest("Only approved or rescheduled bookings can be marked completed");
  }

  const fromStatus = booking.status;
  booking.status = "completed";
  await booking.save();

  await recordStatusChange({
    bookingId: booking._id,
    fromStatus,
    toStatus: "completed",
    changedBy: actor.id,
    changedByRole: actor.role,
  });

  await logAction({
    actor,
    action: "booking.completed",
    entityType: "Booking",
    entityId: booking._id,
  });

  return booking;
}

async function updateBookingStatus({ bookingId, status, actor }) {
  const booking = await getBookingOr404(bookingId);
  const allowed = {
    approved: ["arrived", "in_progress", "completed", "no_show"],
    rescheduled: ["arrived", "in_progress", "completed", "no_show"],
    arrived: ["in_progress", "completed", "no_show"],
    in_progress: ["completed"],
  };
  if (!allowed[booking.status]?.includes(status)) {
    throw ApiError.badRequest(`Cannot change booking from "${booking.status}" to "${status}"`);
  }
  const fromStatus = booking.status;
  booking.status = status;
  await booking.save();
  await recordStatusChange({ bookingId: booking._id, fromStatus, toStatus: status, changedBy: actor.id, changedByRole: actor.role });
  await logAction({ actor, action: `booking.${status}`, entityType: "Booking", entityId: booking._id });
  return booking;
}

async function cancelBooking({ bookingId, reason, actor }) {
  const booking = await getBookingOr404(bookingId);
  if (["completed", "cancelled", "rejected"].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot cancel a booking with status "${booking.status}"`);
  }

  const slotToRelease = booking.approvedSlot || booking.requestedSlot;
  await releaseSlot(slotToRelease);

  const fromStatus = booking.status;
  booking.status = "cancelled";
  if (reason) booking.internalNotes = `${booking.internalNotes || ""}\nCancelled: ${reason}`.trim();
  await booking.save();

  await recordStatusChange({
    bookingId: booking._id,
    fromStatus,
    toStatus: "cancelled",
    changedBy: actor.id,
    changedByRole: actor.role,
    message: reason,
  });

  await logAction({
    actor,
    action: "booking.cancelled",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { reason },
  });

  return booking;
}

async function addInternalNote({ bookingId, note, actor }) {
  const booking = await getBookingOr404(bookingId);
  booking.internalNotes = [booking.internalNotes, `[${actor.name}] ${note}`]
    .filter(Boolean)
    .join("\n");
  await booking.save();

  await logAction({
    actor,
    action: "booking.note_added",
    entityType: "Booking",
    entityId: booking._id,
  });

  return booking;
}

module.exports = {
  createBookingRequest,
  approveBooking,
  rejectBooking,
  rescheduleBooking,
  completeBooking,
  updateBookingStatus,
  cancelBooking,
  addInternalNote,
  getBookingOr404,
};
