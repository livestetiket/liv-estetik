require("express-async-errors");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const env = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/error_middleware");

const authRoutes = require("./routes/auth_route");
const publicRoutes = require("./routes/public_route");
const receptionRoutes = require("./routes/reception_route");
const adminRoutes = require("./routes/admin_route");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "liv-estetik-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;