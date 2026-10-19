const connectDB = require("../config/db");
const mongoose = require("mongoose");
const Customer = require("../models/customer");
const Booking = require("../models/booking");
const { normalizePhone } = require("../service/customer_service");

async function run() {
  await connectDB();
  const customers = await Customer.find({ phone: { $type: "string", $ne: "" }, normalizedPhone: { $exists: false } }).select("_id phone").lean();
  let phoneUpdates = 0;
  for (const customer of customers) {
    const normalizedPhone = normalizePhone(customer.phone);
    if (!normalizedPhone) continue;
    // eslint-disable-next-line no-await-in-loop
    await Customer.updateOne({ _id: customer._id, normalizedPhone: { $exists: false } }, { $set: { normalizedPhone } });
    phoneUpdates += 1;
  }
  const legacyBookings = await Booking.updateMany({ source: { $exists: false } }, { $set: { source: "unknown" } });
  console.log(`[migration] normalized phone values updated: ${phoneUpdates}; legacy booking sources marked unknown: ${legacyBookings.modifiedCount}`);
}

run().catch((error) => {
  console.error("[migration] reporting field backfill failed:", error.message);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
