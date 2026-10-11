const connectDB = require("../config/db");
const Service = require("../models/service");
const TimeSlot = require("../models/timeslot");
const mongoose = require("mongoose");

async function run() {
  await connectDB();
  const services = await Service.find({}).lean();
  console.log("services count", services.length);
  services.forEach((s) => console.log(JSON.stringify({
    id: String(s._id),
    name: s.name,
    active: s.active,
    visible: s.visible,
    duration: s.estimatedDurationMinutes,
    max: s.maxAppointmentsPerDay,
  }, null, 2)));

  const slots = await TimeSlot.find({}).populate("service", "name").lean();
  console.log("slots count", slots.length);
  slots.slice(0, 20).forEach((s) => console.log(JSON.stringify({
    id: String(s._id),
    service: s.service?.name,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    status: s.status,
  }, null, 2)));

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
