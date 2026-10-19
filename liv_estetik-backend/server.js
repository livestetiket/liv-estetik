const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const { generateSlotsForNextDays } = require("./service/slot_generator");

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
