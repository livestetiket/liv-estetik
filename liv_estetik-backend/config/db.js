const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    const errorName = err?.name || "Error";
    const errorCode = err?.code ?? err?.cause?.code;
    const detail = errorCode ? `${errorName}, code ${errorCode}` : errorName;
    let hint = "Check the MONGO_URI, Atlas database user, and cluster status.";

    if (errorName === "MongoServerSelectionError" || errorName === "MongoNetworkError") {
      hint = "Check MongoDB Atlas Network Access for this Render service's outbound IP ranges, plus cluster status and DNS/network access.";
    } else if (errorName === "MongoParseError") {
      hint = "Check the MONGO_URI format and URL-encode special characters in the database username or password.";
    } else if (errorCode === 18 || errorCode === 8000) {
      hint = "MongoDB rejected authentication; check the database username/password and URL-encode any special characters.";
    }

    // Keep the URI and nested server details out of logs because they can reveal credentials or infrastructure.
    // eslint-disable-next-line no-console
    console.error(`[db] MongoDB connection failed (${detail}). ${hint}`);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.warn("[db] MongoDB disconnected");
  });
}

module.exports = connectDB;
