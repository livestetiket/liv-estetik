require("dotenv").config();

const nodeEnv = process.env.NODE_ENV || "production";
const isProduction = nodeEnv === "production";

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

const jwtSecret = required("JWT_SECRET", isProduction ? undefined : "dev-secret-change-me");
const adminEmail = required("ADMIN_EMAIL", isProduction ? undefined : "admin@livestetik.com");
const adminPassword = required("ADMIN_PASSWORD", isProduction ? undefined : "Admin@123456");

if (isProduction && jwtSecret.length < 32) {
  throw new Error("[env] JWT_SECRET must be at least 32 characters in production");
}

if (isProduction && adminPassword.length < 16) {
  throw new Error("[env] ADMIN_PASSWORD must be at least 16 characters in production");
}

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv,

  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/liv-estetik"),

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  allowedOrigins: process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map(url => url.trim())
    : (process.env.NODE_ENV === "production" 
      ? [
          "https://livestetikaddis.com",
          "https://admin.livestetikaddis.com"
        ]
      : [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174"
        ]
    ),

  clinicName: process.env.CLINIC_NAME || "Liv Estetik",
  clinicPhone: process.env.CLINIC_PHONE || "+251 911 50 40 02",
  clinicAddress: process.env.CLINIC_ADDRESS || "Bole Road, Snap Plaza 1st Floor, Addis Ababa, Ethiopia",

  adminEmail,
  adminName: process.env.ADMIN_NAME || "Admin",
    adminPassword,

  emailProvider: process.env.EMAIL_PROVIDER || "console",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
};

module.exports = env;