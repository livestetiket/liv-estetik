const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const { generateSlotsForNextDays } = require("./service/slot_generator");
const Service = require("./models/service");

const SLOT_HORIZON_DAYS = 14;
const SLOT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function refreshRollingSlotWindow() {
  try {
    const res = await generateSlotsForNextDays(SLOT_HORIZON_DAYS);
    // eslint-disable-next-line no-console
    console.log("[slot-generator] rolling refresh:", res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[slot-generator] rolling refresh failed:", err);
  }
}

async function start() {
  await connectDB();

  // Hair transplant is an explicitly requested bookable treatment. Repair only
  // its active catalog records when an old zero-capacity value prevents slots
  // from being generated; leave every other service's configured capacity as-is.
  const hairCapacityFix = await Service.updateMany(
    { name: /hair\s*transplant/i, active: true, $or: [{ maxAppointmentsPerDay: { $lte: 0 } }, { maxAppointmentsPerDay: { $exists: false } }] },
    { $set: { maxAppointmentsPerDay: 1 } }
  );
  if (hairCapacityFix.modifiedCount) {
    // eslint-disable-next-line no-console
    console.log(`[service] enabled one daily appointment for ${hairCapacityFix.modifiedCount} active hair transplant service(s)`);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Liv Estetik API listening on port ${env.port}`);
  });

  // Seed a rolling future slot window on startup.
  await refreshRollingSlotWindow();

  // Keep a rolling slot horizon populated automatically in the background.
  setInterval(() => {
    refreshRollingSlotWindow();
  }, SLOT_REFRESH_INTERVAL_MS);
}

start();

process.on("unhandledRejection", (err) => {
  // eslint-disable-next-line no-console
  console.error(`[server] Unhandled rejection (${err?.name || "Error"}).`);
});
