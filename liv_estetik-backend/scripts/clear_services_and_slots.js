const mongoose = require("mongoose");
const connectDB = require("../config/db");
const assertLocalDatabase = require("./require_local_database");
const Service = require("../models/service");
const TimeSlot = require("../models/timeslot");

async function clearServicesAndSlots() {
  assertLocalDatabase();
  await connectDB();

  const serviceResult = await Service.deleteMany({});
  const timeSlotResult = await TimeSlot.deleteMany({});

  console.log(`[cleanup] removed ${serviceResult.deletedCount || 0} services`);
  console.log(`[cleanup] removed ${timeSlotResult.deletedCount || 0} time slots`);

  await mongoose.connection.close();
}

clearServicesAndSlots().catch((err) => {
  console.error("[cleanup] error", err);
  process.exit(1);
});
