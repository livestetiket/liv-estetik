const mongoose = require("mongoose");
const env = require("../config/env");
const connectDB = require("../config/db");
const User = require("../models/user");

async function main() {
  await connectDB();
  const admin = await User.findOne({ email: env.adminEmail.toLowerCase(), role: "admin" });
  if (!admin) throw new Error("Configured ADMIN_EMAIL must match an existing Admin before marking it primary.");
  await User.updateMany({ isPrimaryAdmin: true, _id: { $ne: admin._id } }, { $set: { isPrimaryAdmin: false } });
  admin.isPrimaryAdmin = true;
  await admin.save();
  console.log(`[migration] Protected the configured primary administrator (${admin.email}).`);
}

main().catch((error) => { console.error(`[migration] ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
