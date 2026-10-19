const CallActivity = require("../models/call_activity");
const SocialPost = require("../models/social_post");
const FollowerObservation = require("../models/follower_observation");
const ClinicReport = require("../models/clinic_report");
const Booking = require("../models/booking");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const { logAction } = require("../service/audit_service");
const { getPeriod, buildReport, generateAndSave } = require("../service/reporting_service");

function dateFilter(query, field) {
  const filter = {};
  if (query.from || query.to) {
    filter[field] = {};
    if (query.from) filter[field].$gte = new Date(query.from);
    if (query.to) filter[field].$lt = new Date(query.to);
  }
  return filter;
}

const listCalls = asyncHandler(async (req, res) => {
  const filter = { ...dateFilter(req.query, "loggedAt") };
  if (req.query.followUp === "true") filter.followUpRequired = true;
  if (req.query.direction) filter.direction = req.query.direction;
  const rows = await CallActivity.find(filter).populate("service", "name category").populate("booking", "fullName phone serviceName status").populate("staff", "name role").sort({ loggedAt: -1 }).limit(300);
  res.json({ data: rows });
});

const createCall = asyncHandler(async (req, res) => {
  if (req.body.booking && !await Booking.exists({ _id: req.body.booking })) throw ApiError.badRequest("Linked appointment was not found.");
  const row = await CallActivity.create({ ...req.body, staff: req.user.id });
  await logAction({ actor: req.user, action: "call.logged", entityType: "CallActivity", entityId: row._id, metadata: { direction: row.direction, outcome: row.outcome, linkedBooking: Boolean(row.booking) } });
  res.status(201).json({ data: row });
});

const updateCall = asyncHandler(async (req, res) => {
  const row = await CallActivity.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).populate("service", "name category").populate("booking", "fullName phone serviceName status").populate("staff", "name role");
  if (!row) throw ApiError.notFound("Call record not found");
  await logAction({ actor: req.user, action: "call.corrected", entityType: "CallActivity", entityId: row._id, metadata: { fields: Object.keys(req.body) } });
  res.json({ data: row });
});

const listPosts = asyncHandler(async (req, res) => {
  const filter = { ...dateFilter(req.query, "publishedAt") };
  if (req.query.platform) filter.platform = req.query.platform;
  res.json({ data: await SocialPost.find(filter).populate("recordedBy", "name").sort({ publishedAt: -1 }).limit(300) });
});

const createPost = asyncHandler(async (req, res) => {
  const row = await SocialPost.create({ ...req.body, recordedBy: req.user.id });
  await logAction({ actor: req.user, action: "social.post_recorded", entityType: "SocialPost", entityId: row._id, metadata: { platform: row.platform, publishedAt: row.publishedAt } });
  res.status(201).json({ data: row });
});

const listFollowers = asyncHandler(async (req, res) => {
  const filter = req.query.platform ? { platform: req.query.platform } : {};
  res.json({ data: await FollowerObservation.find(filter).populate("recordedBy", "name").sort({ observedAt: -1 }).limit(500) });
});

const createFollower = asyncHandler(async (req, res) => {
  const row = await FollowerObservation.create({ ...req.body, source: "manual", recordedBy: req.user.id });
  await logAction({ actor: req.user, action: "social.followers_recorded", entityType: "FollowerObservation", entityId: row._id, metadata: { platform: row.platform, source: row.source } });
  res.status(201).json({ data: row });
});

const reportPreview = asyncHandler(async (req, res) => {
  let period;
  try { period = getPeriod(req.query.type || "daily", req.query); }
  catch (error) { throw ApiError.badRequest(error.message); }
  res.json({ data: await buildReport(period) });
});

const generateReport = asyncHandler(async (req, res) => {
  let period;
  try { period = getPeriod(req.body.type, req.body); }
  catch (error) { throw ApiError.badRequest(error.message); }
  const report = await generateAndSave(period, req.user);
  await logAction({ actor: req.user, action: "report.generated", entityType: "ClinicReport", entityId: report._id, metadata: { type: report.type, periodStart: report.periodStart, periodEnd: report.periodEnd } });
  res.status(201).json({ data: report });
});

const listReports = asyncHandler(async (_req, res) => {
  res.json({ data: await ClinicReport.find().populate("generatedBy", "name").sort({ generatedAt: -1 }).limit(100) });
});

const markShareOpened = asyncHandler(async (req, res) => {
  const report = await ClinicReport.findById(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");
  report.shareOpenedAt = new Date();
  report.shareOpenedBy = req.user.id;
  await report.save();
  await logAction({ actor: req.user, action: "report.whatsapp_share_opened", entityType: "ClinicReport", entityId: report._id });
  res.json({ data: { status: "share_link_opened", shareOpenedAt: report.shareOpenedAt } });
});

function csvCell(value) {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, '""')}"`;
}

const exportReportCsv = asyncHandler(async (req, res) => {
  let metrics;
  let period;
  try { period = getPeriod(req.query.type || "daily", req.query); metrics = await buildReport(period); }
  catch (error) { throw ApiError.badRequest(error.message); }
  const rows = [["Metric", "Value"], ["Reporting period", metrics.period.label], ["Timezone", metrics.period.timezone], ["New bookings", metrics.metrics.newBookings], ["Unique patients", metrics.metrics.uniquePatients], ["New patient registrations", metrics.metrics.newPatientRegistrations]];
  for (const [name, value] of Object.entries(metrics.metrics.serviceBookings)) rows.push([`${name} bookings`, value]);
  for (const [name, value] of Object.entries(metrics.metrics.bookingsBySource)) rows.push([`Booking source: ${name}`, value]);
  for (const [name, value] of Object.entries(metrics.metrics.appointmentOutcomes)) rows.push([`Appointments ${name}`, value]);
  rows.push(["Calls recorded", metrics.metrics.calls], ["Calls generating bookings", metrics.metrics.callsGeneratingBookings], ["Follow-ups required", metrics.metrics.followUpsRequired], ["Social posts published", metrics.metrics.postsPublished]);
  for (const [name, value] of Object.entries(metrics.metrics.postsByPlatform)) rows.push([`Posts: ${name}`, value]);
  rows.push(["Latest TikTok followers", metrics.metrics.latestTikTokFollowers ?? "Unavailable"], ["TikTok follower change", metrics.metrics.followerChange ?? "Baseline unavailable"]);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="liv-estetik-${period.type}-${period.label.replace(/[^0-9-]/g, "_")}.csv"`);
  res.send(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"));
});

module.exports = { listCalls, createCall, updateCall, listPosts, createPost, listFollowers, createFollower, reportPreview, generateReport, listReports, markShareOpened, exportReportCsv };
