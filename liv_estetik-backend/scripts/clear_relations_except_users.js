const mongoose = require("mongoose");
const connectDB = require("../config/db");
const assertLocalDatabase = require("./require_local_database");
const AuditLog = require("../models/audit_log");
const Booking = require("../models/booking");
const BookingStatusHistory = require("../models/booking_status_history");
const Customer = require("../models/customer");
const EmailNotification = require("../models/email_notification");
const Message = require("../models/message");
const Service = require("../models/service");
const TimeSlot = require("../models/timeslot");

async function clearData() {
  assertLocalDatabase();
  await connectDB();

  const results = [];

  results.push({ name: "AuditLog", deleted: (await AuditLog.deleteMany({})).deletedCount });
  results.push({ name: "Booking", deleted: (await Booking.deleteMany({})).deletedCount });
  results.push({ name: "BookingStatusHistory", deleted: (await BookingStatusHistory.deleteMany({})).deletedCount });
  results.push({ name: "Customer", deleted: (await Customer.deleteMany({})).deletedCount });
  results.push({ name: "EmailNotification", deleted: (await EmailNotification.deleteMany({})).deletedCount });
  results.push({ name: "Message", deleted: (await Message.deleteMany({})).deletedCount });
  results.push({ name: "Service", deleted: (await Service.deleteMany({})).deletedCount });
  results.push({ name: "TimeSlot", deleted: (await TimeSlot.deleteMany({})).deletedCount });

  console.log("Data removal results:");
  results.forEach((result) => console.log(`- ${result.name}: ${result.deleted} documents deleted`));

  await mongoose.connection.close();
}

clearData().catch((err) => {
  console.error("Error clearing related data:", err);
  process.exit(1);
});
