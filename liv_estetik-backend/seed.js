/* eslint-disable no-console */
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const env = require("./config/env");

const User = require("./models/user");
const Service = require("./models/service");
const Testimonial = require("./models/testimonial");
const TimeSlot = require("./models/timeslot");

const SAMPLE_SERVICES = [
  { name: "Hydra Facial", category: "Skin / Anti-aging", estimatedDurationMinutes: 60, sortOrder: 1, icon: "✨", maxAppointmentsPerDay: 5 },
  { name: "Keratin Treatment", category: "Hair", estimatedDurationMinutes: 120, sortOrder: 2, icon: "💇", maxAppointmentsPerDay: 2 },
  { name: "Laser Hair Removal", category: "Body", estimatedDurationMinutes: 45, sortOrder: 3, icon: "🌟", maxAppointmentsPerDay: 6 },
  { name: "Botox Consultation", category: "Skin / Anti-aging", estimatedDurationMinutes: 30, sortOrder: 4, icon: "💉", maxAppointmentsPerDay: 8 },
  { name: "Body Contouring", category: "Body", estimatedDurationMinutes: 90, sortOrder: 5, icon: "🧖", maxAppointmentsPerDay: 2 },
  {
    name: "Micro-needling",
    category: "Skin / Anti-aging",
    estimatedDurationMinutes: 60,
    sortOrder: 6,
    icon: "🩸",
    active: false, // coming soon: visible but not bookable
    maxAppointmentsPerDay: 0,
  },
];

const SAMPLE_TESTIMONIALS = [
  {
    quote: "The team made me feel comfortable from the first consultation. My skin has never looked better.",
    name: "Selam T.",
    initials: "ST",
    service: "Hydra Facial",
    rating: 5,
    sortOrder: 1,
  },
  {
    quote: "Professional, clean, and the results speak for themselves. Highly recommend Liv Estetik.",
    name: "Bethel A.",
    initials: "BA",
    service: "Laser Hair Removal",
    rating: 5,
    sortOrder: 2,
  },
  {
    quote: "Booking was easy and the staff kept me updated every step of the way.",
    name: "Hana M.",
    initials: "HM",
    service: "Keratin Treatment",
    rating: 5,
    sortOrder: 3,
  },
];

function buildUpcomingSlots() {
  const slots = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);

  // Next 5 business days (including Saturday), 9am-12:30pm, 30-minute slots, skip a few to show "unavailable".
  for (let day = 1; day <= 5; day += 1) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() + day);
    dayStart.setHours(9, 0, 0, 0);

    if (dayStart.getDay() === 0) {
      continue;
    }

    for (let slotIndex = 0; slotIndex < 8; slotIndex += 1) {
      const startsAt = new Date(dayStart.getTime() + slotIndex * 30 * 60 * 1000);
      const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

      // Make a handful of slots unavailable/blocked to demonstrate frontend states.
      let status = "available";
      if (slotIndex === 4 || slotIndex === 5) status = "unavailable";
      if (slotIndex === 10) status = "blocked";

      slots.push({
        startsAt,
        endsAt,
        status,
        capacity: 1,
        bookedCount: 0,
        blockedReason: status === "blocked" ? "Staff unavailable" : undefined,
      });
    }
  }
  return slots;
}

async function seed() {
  await connectDB();

  console.log("[seed] Seeding admin user...");
  const existingAdmin = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.adminPassword, 10);
    await User.create({
      name: env.adminName,
      email: env.adminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
      active: true,
    });
    console.log(`[seed] Created admin user: ${env.adminEmail}`);
  } else {
    console.log("[seed] Admin user already exists, skipping.");
  }

  console.log("[seed] Seeding services...");
  for (const svc of SAMPLE_SERVICES) {
    await Service.updateOne(
      { name: svc.name },
      { $setOnInsert: { visible: true, active: true, ...svc } },
      { upsert: true }
    );
  }

  console.log("[seed] Seeding testimonials...");
  for (const t of SAMPLE_TESTIMONIALS) {
    await Testimonial.updateOne(
      { name: t.name, quote: t.quote },
      { $setOnInsert: { active: true, ...t } },
      { upsert: true }
    );
  }

  console.log("[seed] Seeding time slots...");
  const existingSlotCount = await TimeSlot.countDocuments({});
  if (existingSlotCount === 0) {
    await TimeSlot.insertMany(buildUpcomingSlots());
    console.log("[seed] Time slots created.");
  } else {
    console.log("[seed] Time slots already exist, skipping.");
  }

  console.log("[seed] Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});