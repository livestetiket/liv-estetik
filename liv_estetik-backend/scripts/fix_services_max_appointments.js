const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Service = require("../models/service");

async function fixServices() {
  await connectDB();

  // Find all services that are missing or have 0 maxAppointmentsPerDay
  const services = await Service.find({
    $or: [
      { maxAppointmentsPerDay: { $exists: false } },
      { maxAppointmentsPerDay: { $lte: 0 } },
    ],
  });

  console.log(`[fix] found ${services.length} services missing or with 0 maxAppointmentsPerDay`);

  for (const svc of services) {
    svc.maxAppointmentsPerDay = 1;
    await svc.save();
    console.log(`[fix] updated ${svc.name}: maxAppointmentsPerDay = 1`);
  }

  await mongoose.connection.close();
}

fixServices().catch((err) => {
  console.error("[fix] error", err);
  process.exit(1);
});
