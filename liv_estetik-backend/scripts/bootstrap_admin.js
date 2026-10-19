const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const env = require("../config/env");
const User = require("../models/user");

async function bootstrapAdmin() {
  await connectDB();

  const email = env.adminEmail.toLowerCase();
  let admin = await User.findOne({ email });

  if (admin && admin.role !== "admin") {
    throw new Error("Configured ADMIN_EMAIL belongs to a non-admin account; no changes were made.");
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);

  if (!admin) {
    admin = new User({
      name: env.adminName,
      email,
      passwordHash,
      role: "admin",
      active: true,
    });
  } else {
    admin.passwordHash = passwordHash;
    admin.active = true;
  }

  await admin.save();
  console.log("[admin-bootstrap] Configured admin account is ready.");
}

bootstrapAdmin()
  .catch((error) => {
    console.error(`[admin-bootstrap] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
