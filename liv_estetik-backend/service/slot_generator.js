const mongoose = require("mongoose");
const TimeSlot = require("../models/timeslot");
const Service = require("../models/service");

const BUSINESS_START_HOUR = 9;
const WEEKDAY_END_HOUR = 17;
const WEEKDAY_END_MINUTE = 30;
const SATURDAY_END_HOUR = 12;
const SATURDAY_END_MINUTE = 30;

function startOfDay(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function endOfDay(d) {
  const t = new Date(d);
  t.setHours(23, 59, 59, 999);
  return t;
}

function addDays(d, days) {
  const t = new Date(d);
  t.setDate(t.getDate() + days);
  return t;
}

function addMinutes(d, minutes) {
  const t = new Date(d);
  t.setMinutes(t.getMinutes() + minutes);
  return t;
}

function businessWindow(dayStart) {
  const start = new Date(dayStart);
  start.setHours(BUSINESS_START_HOUR, 0, 0, 0);

  const end = new Date(dayStart);
  const dayOfWeek = dayStart.getDay();
  const isSaturday = dayOfWeek === 6;

  end.setHours(
    isSaturday ? SATURDAY_END_HOUR : WEEKDAY_END_HOUR,
    isSaturday ? SATURDAY_END_MINUTE : WEEKDAY_END_MINUTE,
    0,
    0
  );

  return { start, end };
}

function buildCandidateStarts(dayStart, durationMinutes) {
  const { start, end } = businessWindow(dayStart);
  const starts = [];
  let current = new Date(start);

  while (addMinutes(current, durationMinutes) <= end) {
    starts.push(new Date(current));
    current = addMinutes(current, durationMinutes);
  }

  return starts;
}

function overlaps(candidateStart, candidateEnd, existingSlots) {
  return existingSlots.some((slot) => {
    return slot.startsAt < candidateEnd && slot.endsAt > candidateStart;
  });
}

async function generateSlotsForDate(targetDate) {
  const today = startOfDay(new Date());
  const dayStart = startOfDay(targetDate);

  if (dayStart <= today) return { created: 0, skipped: true };

  const dayOfWeek = dayStart.getDay();
  if (dayOfWeek === 0) {
    return { created: 0, skipped: true, reason: "sunday" };
  }

  const services = await Service.find({ active: true, maxAppointmentsPerDay: { $gt: 0 } }).lean();
  // eslint-disable-next-line no-console
  console.log(`[slot-generator] generateSlotsForDate: found ${services.length} eligible services for ${dayStart.toISOString().slice(0, 10)}`);
  let created = 0;

  for (const svc of services) {
    const duration = svc.estimatedDurationMinutes;
    const maxPerDay = svc.maxAppointmentsPerDay;
    // eslint-disable-next-line no-console
    console.log(`[slot-generator]   service: ${svc.name} (id=${svc._id}, duration=${duration}min, max=${maxPerDay}/day)`);
    if (!duration || duration <= 0) continue;

    const existing = await TimeSlot.find({
      service: svc._id,
      startsAt: { $gte: dayStart, $lte: endOfDay(dayStart) },
    })
      .sort({ startsAt: 1 })
      .lean();

    const candidateStarts = buildCandidateStarts(dayStart, duration);
    const targetCount = Math.min(maxPerDay, candidateStarts.length);
    const alreadyCount = existing.length;
    const toCreate = Math.max(0, targetCount - alreadyCount);
    if (toCreate === 0) continue;

    const slots = [];
    for (const startsAt of candidateStarts) {
      const endsAt = addMinutes(startsAt, duration);
      if (overlaps(startsAt, endsAt, existing)) continue;
      slots.push({
        service: svc._id,
        startsAt,
        endsAt,
        capacity: 1,
        bookedCount: 0,
        status: "available",
      });
      if (slots.length >= toCreate) break;
    }

    // eslint-disable-next-line no-console
    console.log(`[slot-generator]     created ${slots.length} slots for ${svc.name} on ${dayStart.toISOString().slice(0, 10)}`);

    if (slots.length) {
      // Upsert each slot to make the generator idempotent (no duplicates)
      for (const s of slots) {
        // Keep existing doc if present, otherwise insert the new slot
        // Use startsAt + service as the uniqueness key
        // Note: ensure a compound unique index exists on { service: 1, startsAt: 1 }
        // after deduplication.
        // eslint-disable-next-line no-await-in-loop
        const result = await TimeSlot.updateOne(
          { service: s.service, startsAt: s.startsAt },
          { $setOnInsert: s },
          { upsert: true }
        );
        if (result.upsertedCount) created += 1;
      }
    }
  }

  return { created, skipped: false };
}

async function generateSlotsForNextDays(days = 7) {
  const results = [];
  for (let i = 1; i <= days; i++) {
    const date = addDays(new Date(), i);
    // eslint-disable-next-line no-await-in-loop
    const r = await generateSlotsForDate(date);
    results.push({ date: date.toISOString().slice(0, 10), ...r });
  }
  return results;
}

module.exports = { generateSlotsForDate, generateSlotsForNextDays };
