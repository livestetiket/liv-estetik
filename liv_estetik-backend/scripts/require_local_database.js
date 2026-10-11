function assertLocalDatabase() {
  const nodeEnv = process.env.NODE_ENV || "production";
  const mongoUri = process.env.MONGO_URI;

  if (nodeEnv === "production") {
    throw new Error("Refusing destructive cleanup when NODE_ENV=production");
  }
  if (!mongoUri) {
    throw new Error("Refusing destructive cleanup: set MONGO_URI to an explicit local database");
  }

  let hostname;
  try {
    hostname = new URL(mongoUri).hostname;
  } catch {
    throw new Error("Refusing destructive cleanup: MONGO_URI is not a valid URL");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (!localHosts.has(hostname)) {
    throw new Error(`Refusing destructive cleanup against non-local MongoDB host: ${hostname}`);
  }
}

module.exports = assertLocalDatabase;