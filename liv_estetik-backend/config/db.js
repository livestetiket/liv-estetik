const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] MongoDB connection failed; verify the configured database service and network access.");
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("[db] MongoDB disconnected");
  });
}

module.exports = connectDB;
