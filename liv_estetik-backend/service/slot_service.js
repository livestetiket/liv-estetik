const TimeSlot = require("../models/timeslot");
const ApiError = require("../util/api_error");
const { getClinicSettings, isSlotWithinSettings } = require("./clinic_settings_service");

/**
 * Atomically reserves a slot: only succeeds if the slot is currently
 * "available" and has remaining capacity. This is the backend re-check
 * required by the docs ("never trust only frontend disabled states").
 */
async function reserveSlot(slotId, session) {
  const settings = await getClinicSettings();
  const candidate = await TimeSlot.findById(slotId).session(session || null);
  if (!candidate) throw ApiError.notFound("Time slot not found");
  if (!isSlotWithinSettings(candidate.startsAt, candidate.endsAt, settings)) {
    throw ApiError.conflict("The selected time is outside the clinic's current operating schedule.");
  }
  const slot = await TimeSlot.findOneAndUpdate(
    {
      _id: slotId,
      status: "available",
      $expr: { $lt: ["$bookedCount", "$capacity"] },
    },
    { $inc: { bookedCount: 1 } },
    { new: true, session }
  );

  if (!slot) {
    throw ApiError.conflict("The selected time slot is no longer available.");
  }

  // Flip to "reserved" once capacity is fully used, in a separate,
  // non-critical update (the reservation itself already succeeded above).
  if (slot.bookedCount >= slot.capacity && slot.status === "available") {
    slot.status = "reserved";
    await slot.save({ session });
  }

  return slot;
}

/**
 * Releases one reservation on a slot (e.g. booking rejected/cancelled).
 * If the slot was fully reserved, it flips back to available.
 */
async function releaseSlot(slotId, session) {
  const slot = await TimeSlot.findById(slotId).session(session || null);
  if (!slot) return null;

  slot.bookedCount = Math.max(0, slot.bookedCount - 1);
  if (slot.status === "reserved" && slot.bookedCount < slot.capacity) {
    slot.status = "available";
  }
  await slot.save({ session });
  return slot;
}

/**
 * Verifies a slot exists and is currently selectable, without reserving it.
 * Used for validating a proposed reschedule slot before committing.
 */
async function assertSlotSelectable(slotId) {
  const slot = await TimeSlot.findById(slotId);
  if (!slot) {
    throw ApiError.notFound("Time slot not found");
  }
  if (slot.status !== "available" || slot.bookedCount >= slot.capacity) {
    throw ApiError.conflict("Selected time slot is not available");
  }
  const settings = await getClinicSettings();
  if (!isSlotWithinSettings(slot.startsAt, slot.endsAt, settings)) {
    throw ApiError.conflict("The selected time is outside the clinic's current operating schedule.");
  }
  return slot;
}

module.exports = { reserveSlot, releaseSlot, assertSlotSelectable };
