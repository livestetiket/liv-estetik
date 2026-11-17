const CallActivity = require("../models/call_activity");
const SocialPost = require("../models/social_post");
const FollowerObservation = require("../models/follower_observation");
const ClinicReport = require("../models/clinic_report");
const Booking = require("../models/booking");
const DailyVisit = require("../models/daily_visit");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const { logAction } = require("../service/audit_service");
const { getPeriod, buildReport, generateAndSave } = require("../service/reporting_service");
const User = require("../models/user");
const Customer = require("../models/customer");
const { notifyRoles, notifyUser } = require("../service/notification_service");

function dateFilter(query, field) {
  const filter = {};
  if (query.from || query.to) {
    filter[field] = {};
    if (query.from) filter[field].$gte = new Date(query.from);
    if (query.to) filter[field].$lt = new Date(query.to);
  }
  return filter;
}

function applyReportPrivacy(report, user) {
  if (user?.permissions?.includes("patients.view")) return report;
  const output = report?.toObject ? report.toObject() : structuredClone(report);
  const reportData = output.metrics?.metrics ? output.metrics : output;
  const metrics = reportData.metrics || {};
  for (const booking of metrics.bookingDetails || []) {
    delete booking.fullName; delete booking.phone; delete booking.email; delete booking.cardNumber;
  }
  for (const call of metrics.callDetails || []) {
    delete call.phone; delete call.linkedBooking; delete call.patientName; delete call.patientCardNumber;
  }
  for (const visit of metrics.visitDetails || []) {
    delete visit.cardNumber; delete visit.fullName; delete visit.phone;
  }
  for (const patient of metrics.patientDetails || []) {
    delete patient.cardNumber; delete patient.fullName; delete patient.phone; delete patient.email;
  }
  for (const message of metrics.messageDetails || []) {
    delete message.name; delete message.email;
  }
  for (const email of metrics.emailDetails || []) delete email.recipient;
  for (const session of metrics.prpSessionDetails || []) {
    delete session.patientName; delete session.patientCardNumber;
  }
  return output;
}

const listCalls = asyncHandler(async (req, res) => {
  const filter = { ...dateFilter(req.query, "loggedAt") };
  if (req.user.role === "call_center_agent") filter.assignedTo = req.user.id;
  if (req.query.followUp === "true") filter.followUpRequired = true;
  if (req.query.direction) filter.direction = req.query.direction;
  const rows = await CallActivity.find(filter).populate("service", "name category").populate("booking", "fullName phone serviceName status").populate("patient", "fullName phone cardNumber").populate("staff", "name role").populate("assignedTo", "name role").populate("updatedBy", "name role").sort({ loggedAt: -1 }).limit(300);
  res.json({ data: rows });
});

const createCall = asyncHandler(async (req, res) => {
  if (req.body.booking && !await Booking.exists({ _id: req.body.booking })) throw ApiError.badRequest("Linked appointment was not found.");
  if (req.body.patient && !await Customer.exists({ _id: req.body.patient })) throw ApiError.badRequest("Patient record was not found.");
  let assignedTo = req.user.role === "call_center_agent" ? req.user.id : req.body.assignedTo;
  if (assignedTo) {
    const agent = await User.findOne({ _id: assignedTo, role: "call_center_agent", active: true }).select("_id");
    if (!agent) throw ApiError.badRequest("Choose an active Call Center Agent for this assignment.");
  }
  const status = req.body.status || (req.body.followUpRequired ? "follow_up_required" : "pending");
  const row = await CallActivity.create({ ...req.body, assignedTo, status, followUpRequired: status === "follow_up_required" || (req.body.followUpRequired && status !== "completed"), staff: req.user.id });
  await logAction({ actor: req.user, action: "call.logged", entityType: "CallActivity", entityId: row._id, metadata: { direction: row.direction, outcome: row.outcome, linkedBooking: Boolean(row.booking) } });
  if (assignedTo && String(assignedTo) !== req.user.id) await notifyUser({ userId: assignedTo, eventKey: `call.assigned:${row._id}`, eventType: "call.assigned", title: "Follow-up assigned", message: `A call follow-up was assigned to you${row.patientName ? ` for ${row.patientName}` : ""}.`, entityType: "CallActivity", entityId: row._id });
  res.status(201).json({ data: row });
});

const updateCall = asyncHandler(async (req, res) => {
  const row = await CallActivity.findById(req.params.id);
  if (!row) throw ApiError.notFound("Call record not found");
  if (req.user.role === "call_center_agent" && String(row.assignedTo || "") !== req.user.id) throw ApiError.forbidden("You can only update follow-ups assigned to you.");
  const patch = { ...req.body };
  if (req.user.role === "call_center_agent") delete patch.assignedTo;
  if (patch.assignedTo) {
    const agent = await User.findOne({ _id: patch.assignedTo, role: "call_center_agent", active: true }).select("_id");
    if (!agent) throw ApiError.badRequest("Choose an active Call Center Agent for this assignment.");
  }
  const wasCompleted = row.status === "completed";
  const previous = Object.fromEntries(Object.keys(patch).map((field) => [field, row[field] ?? null]));
  Object.assign(row, patch, { updatedBy: req.user.id, updatedAt: new Date() });
  if (patch.status) row.followUpRequired = patch.status === "follow_up_required";
  else if (patch.followUpRequired !== undefined) row.status = patch.followUpRequired ? "follow_up_required" : (row.status === "follow_up_required" ? "pending" : row.status);
  if (row.status === "completed") row.followUpRequired = false;
  await row.save();
  await row.populate([{ path: "service", select: "name category" }, { path: "booking", select: "fullName phone serviceName status" }, { path: "patient", select: "fullName phone cardNumber" }, { path: "staff", select: "name role" }, { path: "assignedTo", select: "name role" }, { path: "updatedBy", select: "name role" }]);
  await logAction({ actor: req.user, action: "call.corrected", entityType: "CallActivity", entityId: row._id, metadata: { fields: Object.keys(req.body), previous, updated: Object.fromEntries(Object.keys(patch).map((field) => [field, row[field] ?? null])) } });
  if (patch.assignedTo && String(patch.assignedTo) !== String(req.user.id) && String(patch.assignedTo) !== String(row.staff)) await notifyUser({ userId: patch.assignedTo, eventKey: `call.assigned:${row._id}:${row.updatedAt.getTime()}`, eventType: "call.assigned", title: "Follow-up assigned", message: `A call follow-up was assigned to you${row.patientName ? ` for ${row.patientName}` : ""}.`, entityType: "CallActivity", entityId: row._id });
  if (!wasCompleted && row.status === "completed") await notifyRoles({ eventKey: `call.completed:${row._id}`, eventType: "call.completed", title: "Call follow-up completed", message: `${row.patientName || row.phone || "A patient"}'s follow-up was completed.`, entityType: "CallActivity", entityId: row._id });
  res.json({ data: row });
});

const listVisits = asyncHandler(async (req, res) => {
  const filter = { ...dateFilter(req.query, "visitDate") };
  const rows = await DailyVisit.find(filter).populate("service", "name category").populate("recordedBy", "name role").sort({ visitDate: -1, createdAt: -1 }).limit(500);
  res.json({ data: rows });
});

const createVisit = asyncHandler(async (req, res) => {
  const row = await DailyVisit.create({ ...req.body, recordedBy: req.user.id });
  await logAction({ actor: req.user, action: "visit.logged", entityType: "DailyVisit", entityId: row._id, metadata: { visitDate: row.visitDate, serviceName: row.serviceName } });
  res.status(201).json({ data: row });
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
  res.json({ data: applyReportPrivacy(await buildReport(period), req.user) });
});

const generateReport = asyncHandler(async (req, res) => {
  let period;
  try { period = getPeriod(req.body.type, req.body); }
  catch (error) { throw ApiError.badRequest(error.message); }
  const report = await generateAndSave(period, req.user);
  await logAction({ actor: req.user, action: "report.generated", entityType: "ClinicReport", entityId: report._id, metadata: { type: report.type, periodStart: report.periodStart, periodEnd: report.periodEnd } });
  res.status(201).json({ data: applyReportPrivacy(report, req.user) });
});

const listReports = asyncHandler(async (req, res) => {
  const reports = await ClinicReport.find().populate("generatedBy", "name").sort({ generatedAt: -1 }).limit(100);
  res.json({ data: reports.map((report) => applyReportPrivacy(report, req.user)) });
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
  let raw = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(raw)) raw = `'${raw}`;
  return `"${raw.replace(/"/g, '""')}"`;
}

const exportReportCsv = asyncHandler(async (req, res) => {
  let metrics;
  let period;
  try { period = getPeriod(req.query.type || "daily", req.query); metrics = applyReportPrivacy(await buildReport(period), req.user); }
  catch (error) { throw ApiError.badRequest(error.message); }
  const values = metrics.metrics;
  const rows = [["Section", "Date", "Name", "Card number", "Phone", "Service or activity", "Status or outcome", "Staff", "Value"],
    ["Summary", "", "", "", "", "Reporting period", metrics.period.label, "", ""],
    ["Summary", "", "", "", "", "Timezone", metrics.period.timezone, "", ""],
    ...[["Total bookings", values.totalBookings], ["New bookings", values.newBookings], ["Pending bookings", values.appointmentOutcomes.pending], ["Approved bookings", values.appointmentOutcomes.confirmed], ["Cancelled bookings", values.appointmentOutcomes.cancelled], ["Total patients", values.totalRegisteredPatients], ["New patients", values.newPatientRegistrations], ["Visits in period", values.visits], ["Incoming messages", values.incomingMessages], ["PRP courses", values.prp.totalCourses], ["PRP sessions planned", values.prp.plannedSessions], ["PRP sessions completed", values.prp.completedSessions], ["Call activities", values.calls], ["Completed follow-ups", values.completedFollowUps], ["Pending follow-ups", values.pendingFollowUps], ["Email attempts", values.email.attempts], ["Emails accepted", values.email.accepted], ["Emails delivered", values.email.delivered], ["Failed emails", values.email.failed], ["Pending email attempts", values.email.pending]].map(([name, value]) => ["Summary", "", "", "", "", name, "", "", value]),
  ];
  for (const booking of values.bookingDetails || []) rows.push(["Booking", booking.createdAt, booking.fullName, booking.cardNumber, booking.phone, booking.serviceName, booking.status, booking.approvedBy, ""]);
  for (const call of values.callDetails || []) rows.push(["Call", call.loggedAt, call.patientName || call.linkedBooking, call.patientCardNumber, call.phone, call.purpose || call.serviceName, call.outcome, call.staffName, ""]);
  for (const visit of values.visitDetails || []) rows.push(["Visit", visit.visitDate, visit.fullName, visit.cardNumber, visit.phone, visit.serviceName, "", visit.recordedBy?.name, ""]);
  for (const patient of values.patientDetails || []) rows.push(["Patient", patient.createdAt, patient.fullName, patient.cardNumber, patient.phone, "Registration", "", "", patient.email]);
  for (const message of values.messageDetails || []) rows.push(["Incoming message", message.createdAt, message.name, "", "", "Contact request", message.status, "", message.email]);
  for (const email of values.emailDetails || []) rows.push(["Patient email", email.attemptedAt, "", "", email.recipient, email.template, email.status, "", email.attemptNumber]);
  for (const session of values.prpSessionDetails || []) rows.push(["PRP session", session.treatmentDate, session.patientName, session.patientCardNumber, "", `${session.courseTitle} · session ${session.sessionNumber}`, session.completed ? "Completed" : "Pending", "", session.courseNumber]);
  for (const event of values.auditDetails || []) rows.push(["Audit event", event.createdAt, event.staffName, "", "", event.action, event.entityType, event.role, ""]);
  for (const staff of values.staffActivity || []) rows.push(["Staff activity", "", staff.staffName, "", "", "Bookings created / approved; patients registered; records updated; calls completed", "", staff.role, `${staff.bookingsCreated}/${staff.bookingsApproved}/${staff.patientsRegistered}/${staff.recordsUpdated}/${staff.callsCompleted}`]);
  for (const [name, value] of Object.entries(values.serviceBookings)) rows.push(["Service bookings", "", "", "", "", name, "", "", value]);
  for (const [name, value] of Object.entries(values.bookingsBySource)) rows.push(["Booking source", "", "", "", "", name, "", "", value]);
  for (const [name, value] of Object.entries(values.appointmentOutcomes)) rows.push(["Appointment outcomes", "", "", "", "", name, "", "", value]);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="liv-estetik-${period.type}-${period.label.replace(/[^0-9-]/g, "_")}.csv"`);
  res.send(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`);
});

module.exports = { listCalls, createCall, updateCall, listVisits, createVisit, listPosts, createPost, listFollowers, createFollower, reportPreview, generateReport, listReports, markShareOpened, exportReportCsv };
