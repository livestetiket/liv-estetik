const crypto = require("node:crypto");
const express = require("express");
const asyncHandler = require("../util/async_handler");
const ApiError = require("../util/api_error");
const { runDueScheduledReports } = require("../service/report_scheduler_service");

const router = express.Router();

router.post("/reports/run", asyncHandler(async (req, res) => {
  const expected = process.env.REPORT_CRON_SECRET || "";
  const authorization = req.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (expected.length < 32) throw ApiError.internal("Scheduled report trigger is not configured");
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !crypto.timingSafeEqual(expectedBytes, providedBytes)) {
    throw ApiError.unauthorized("Unauthorized scheduled report trigger");
  }
  res.json({ data: await runDueScheduledReports() });
}));

module.exports = router;
