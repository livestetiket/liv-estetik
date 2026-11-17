const Booking = require("../models/booking");
const BookingStatusHistory = require("../models/booking_status_history");
const Customer = require("../models/customer");
const CallActivity = require("../models/call_activity");
const ClinicReport = require("../models/clinic_report");
const DailyVisit = require("../models/daily_visit");
const PrpCourse = require("../models/prp_course");
const Message = require("../models/message");
const EmailNotification = require("../models/email_notification");
const AuditLog = require("../models/audit_log");

const TZ = "Africa/Addis_Ababa";
const DAY = 24 * 60 * 60 * 1000;
const SERVICE_TYPES = [
  "Hair Transplant Consultation",
  "Hair Transplant Procedure",
  "PRP Treatment",
  "Dermatology Consultation",
  "Facial Treatment",
  "Body Treatment",
  "Other Services",
];

function dateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map(({ type, value }) => [type, Number(value)]));
}

function addDays({ year, month, day }, count) {
  const date = new Date(Date.UTC(year, month - 1, day + count));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function localMidnightUtc(parts) {
  // Ethiopia uses UTC+03:00 year-round; doing the conversion explicitly avoids host timezone drift.
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - (3 * 60 * 60 * 1000));
}

function dayLabel(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function getPeriod(type, { date, month, from, to } = {}) {
  const now = new Date();
  let startParts;
  let endParts;
  if (type === "custom") {
    if (!from || !to || from > to) throw new Error("Select a valid inclusive start and end date.");
    startParts = parseDay(from);
    endParts = addDays(parseDay(to), 1);
  } else if (type === "monthly") {
    const anchor = month ? parseMonth(month) : dateParts(now);
    startParts = { year: anchor.year, month: anchor.month, day: 1 };
    endParts = anchor.month === 12 ? { year: anchor.year + 1, month: 1, day: 1 } : { year: anchor.year, month: anchor.month + 1, day: 1 };
  } else {
    const anchor = date ? parseDay(date) : dateParts(now);
    startParts = anchor;
    if (type === "weekly") {
      const day = new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day)).getUTCDay();
      startParts = addDays(anchor, -((day + 6) % 7));
      endParts = addDays(startParts, 7);
    } else if (type === "daily") {
      endParts = addDays(anchor, 1);
    } else {
      throw new Error("Unsupported report period.");
    }
  }
  const start = localMidnightUtc(startParts);
  const end = localMidnightUtc(endParts);
  let previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
  if (type === "monthly") {
    const previousMonth = startParts.month === 1
      ? { year: startParts.year - 1, month: 12, day: 1 }
      : { year: startParts.year, month: startParts.month - 1, day: 1 };
    previousStart = localMidnightUtc(previousMonth);
  }
  return { type, start, end, previousStart, previousEnd: start, label: `${dayLabel(startParts)} – ${dayLabel(addDays(endParts, -1))}` };
}

function parseDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) throw new Error("Date must use YYYY-MM-DD format.");
  const result = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const check = new Date(Date.UTC(result.year, result.month - 1, result.day));
  if (check.getUTCFullYear() !== result.year || check.getUTCMonth() + 1 !== result.month || check.getUTCDate() !== result.day) throw new Error("Date is not valid.");
  return result;
}

function parseMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value || "");
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) throw new Error("Month must use YYYY-MM format.");
  return { year: Number(match[1]), month: Number(match[2]) };
}

function normalizedServiceName(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function blankServiceCounts(bookings) {
  const names = new Map(SERVICE_TYPES.map((name) => [normalizedServiceName(name), name]));
  for (const booking of bookings) {
    const rawName = String(booking.serviceName || booking.service?.name || "").trim();
    const normalized = normalizedServiceName(rawName);
    if (normalized && !names.has(normalized)) names.set(normalized, rawName);
  }
  const counts = Object.fromEntries([...names.values(), "Other Services"].map((name) => [name, 0]));
  for (const booking of bookings) {
    const name = normalizedServiceName(booking.serviceName || booking.service?.name);
    const matched = names.get(name);
    counts[matched || "Other Services"] += 1;
  }
  return counts;
}

async function buildReport(period) {
  const window = { $gte: period.start, $lt: period.end };
  const dayCount = Math.max(1, Math.ceil((period.end - period.start) / DAY));
  const previousStart = period.previousStart;
  const [newBookings, scheduledBookings, cancellations, noShows, calls, newPatients, newPatientRows, previousBookings, visits, totalBookings, totalPatients, totalVisits, newMessages, messageRows, totalMessages, totalCalls, coursesCreated, prpSessionCourses, allCourseCount, allPrpSessions, emailRows, auditRows, completedCalls] = await Promise.all([
    Booking.find({ createdAt: window }).select("customer service fullName phone email serviceName source requestedStartsAt createdAt status").populate("service", "name").sort({ createdAt: 1 }).lean(),
    Booking.find({ $or: [{ approvedStartsAt: window }, { requestedStartsAt: window }] }).select("customer status approvedStartsAt requestedStartsAt").lean(),
    BookingStatusHistory.distinct("booking", { toStatus: "cancelled", createdAt: window }),
    BookingStatusHistory.distinct("booking", { toStatus: "no_show", createdAt: window }),
    CallActivity.find({ loggedAt: window }).select("booking service staff outcome followUpRequired phone purpose notes patientName patientCardNumber loggedAt").populate("service", "name").populate("booking", "fullName serviceName").populate("staff", "name").lean(),
    Customer.countDocuments({ createdAt: window }),
    Customer.find({ createdAt: window }).select("fullName cardNumber email phone createdAt").sort({ createdAt: 1 }).lean(),
    Booking.countDocuments({ createdAt: { $gte: previousStart, $lt: period.start } }),
    DailyVisit.find({ visitDate: window }).select("visitDate cardNumber fullName phone serviceName notes recordedBy").populate("recordedBy", "name role").sort({ visitDate: 1, createdAt: 1 }).lean(),
    Booking.countDocuments(),
    Customer.countDocuments(),
    DailyVisit.countDocuments(),
    Message.countDocuments({ createdAt: window }),
    Message.find({ createdAt: window }).select("name email status createdAt").sort({ createdAt: 1 }).lean(),
    Message.countDocuments(),
    CallActivity.countDocuments(),
    PrpCourse.find({ createdAt: window }).select("sessions createdAt").lean(),
    PrpCourse.find({ "sessions.treatmentDate": window }).select("patient courseNumber title sessions").populate("patient", "fullName cardNumber").lean(),
    PrpCourse.countDocuments(),
    PrpCourse.aggregate([{ $unwind: "$sessions" }, { $group: { _id: null, planned: { $sum: 1 }, completed: { $sum: { $cond: ["$sessions.completed", 1, 0] } }, completedInPeriod: { $sum: { $cond: [{ $and: ["$sessions.completed", { $gte: ["$sessions.treatmentDate", period.start] }, { $lt: ["$sessions.treatmentDate", period.end] }] }, 1, 0] } } } }]),
    EmailNotification.find({ $or: [{ createdAt: window }, { lastAttemptAt: window }, { attemptHistory: { $elemMatch: { attemptedAt: window } } }] }).select("to status attempts createdAt lastAttemptAt attemptHistory template booking error").lean(),
    AuditLog.find({ createdAt: window, actor: { $ne: null }, actorRole: { $nin: ["public", "system"] } }).select("actor actorName actorRole action entityType entityId createdAt metadata").lean(),
    CallActivity.find({ status: "completed", updatedAt: window }).select("updatedBy").lean(),
  ]);

  const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: cancellations.length, noShow: noShows.length, rejected: 0 };
  const appointmentIds = new Set();
  for (const booking of scheduledBookings) {
    const key = String(booking._id);
    if (appointmentIds.has(key)) continue;
    appointmentIds.add(key);
    if (booking.status === "pending") statusCounts.pending += 1;
    else if (["approved", "rescheduled", "arrived", "in_progress"].includes(booking.status)) statusCounts.confirmed += 1;
    else if (booking.status === "completed") statusCounts.completed += 1;
    else if (booking.status === "rejected") statusCounts.rejected += 1;
  }

  const patientKeys = new Set(newBookings.map((booking) => String(booking.customer || booking.phone || booking.email || booking._id)));
  const bookingSources = Object.fromEntries(["website", "phone", "whatsapp", "tiktok", "instagram", "facebook", "walk_in", "referral", "other", "unknown"].map((source) => [source, 0]));
  for (const booking of newBookings) bookingSources[booking.source in bookingSources ? booking.source : "unknown"] += 1;
  const callsGeneratingBookings = new Set(calls.filter((call) => call.booking).map((call) => String(call.booking._id || call.booking))).size;
  const bookingApprovers = new Map(auditRows.filter((event) => event.action === "booking.approved").map((event) => [String(event.entityId), event.actorName || "Unknown staff"]));
  const sessions = allPrpSessions[0] || { planned: 0, completed: 0, completedInPeriod: 0 };
  const emailStatus = { attempts: 0, accepted: 0, delivered: 0, failed: 0, pending: 0, simulated: 0 };
  const emailDetails = [];
  for (const email of emailRows) {
    const history = (email.attemptHistory || []).filter((attempt) => attempt.attemptedAt >= period.start && attempt.attemptedAt < period.end);
    const records = history.length ? history : (!email.attemptHistory?.length && email.lastAttemptAt >= period.start && email.lastAttemptAt < period.end ? Array.from({ length: Math.max(1, Number(email.attempts || 0)) }, () => ({ status: email.status })) : []);
    if (!records.length && ["queued", "sending"].includes(email.status) && email.createdAt >= period.start && email.createdAt < period.end) emailStatus.pending += 1;
    for (const [index, attempt] of records.entries()) {
      emailStatus.attempts += 1;
      if (attempt.status === "sent") emailStatus.accepted += 1;
      else if (attempt.status === "delivered") { emailStatus.accepted += 1; emailStatus.delivered += 1; }
      else if (attempt.status === "failed") emailStatus.failed += 1;
      else if (["queued", "sending"].includes(attempt.status)) emailStatus.pending += 1;
      else if (attempt.status === "simulated") emailStatus.simulated += 1;
      emailDetails.push({ attemptedAt: attempt.attemptedAt || email.lastAttemptAt || email.createdAt, template: email.template, recipient: email.to, status: attempt.status, attemptNumber: attempt.attempt || index + 1 });
    }
  }
  const prpSessionDetails = prpSessionCourses.flatMap((course) => (course.sessions || [])
    .filter((session) => session.treatmentDate >= period.start && session.treatmentDate < period.end)
    .map((session) => ({ patientName: course.patient?.fullName, patientCardNumber: course.patient?.cardNumber, courseNumber: course.courseNumber, courseTitle: course.title, sessionNumber: session.sessionNumber, treatmentDate: session.treatmentDate, completed: Boolean(session.completed) })));
  const staffMap = new Map();
  for (const event of auditRows) {
    const key = String(event.actor || `${event.actorRole}:${event.actorName || "Unknown staff"}`);
    const staff = staffMap.get(key) || { staffId: event.actor ? String(event.actor) : undefined, staffName: event.actorName || "Unknown staff", role: event.actorRole || "unknown", bookingsCreated: 0, bookingsApproved: 0, patientsRegistered: 0, recordsUpdated: 0, callsCompleted: 0, recordedActions: 0 };
    staff.recordedActions += 1;
    if (event.action === "booking.created") staff.bookingsCreated += 1;
    if (event.action === "booking.approved") staff.bookingsApproved += 1;
    if (event.action === "patient.registered") staff.patientsRegistered += 1;
    if (/\.(updated|corrected|permissions_changed)$/.test(event.action)) staff.recordsUpdated += 1;
    staffMap.set(key, staff);
  }
  for (const call of completedCalls) {
    if (!call.updatedBy) continue;
    const key = String(call.updatedBy);
    const staff = staffMap.get(key) || { staffId: key, staffName: "Staff member", role: "unknown", bookingsCreated: 0, bookingsApproved: 0, patientsRegistered: 0, recordsUpdated: 0, callsCompleted: 0, recordedActions: 0 };
    staff.callsCompleted += 1;
    staffMap.set(key, staff);
  }
  const staffActivity = [...staffMap.values()].sort((left, right) => right.recordedActions - left.recordedActions || left.staffName.localeCompare(right.staffName));
  const sessionsPlannedInPeriod = coursesCreated.reduce((sum, course) => sum + course.sessions.length, 0);
  const completedFollowUps = completedCalls.length;
  const pendingFollowUps = await CallActivity.countDocuments({ followUpRequired: true, status: { $ne: "completed" } });
  const trend = Array.from({ length: dayCount }, (_, index) => {
    const dayStart = new Date(period.start.getTime() + (index * DAY));
    const dayEnd = new Date(dayStart.getTime() + DAY);
    return {
      date: new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(dayStart),
      newBookings: newBookings.filter((booking) => booking.createdAt >= dayStart && booking.createdAt < dayEnd).length,
      newPatients: newPatientRows.filter((patient) => patient.createdAt >= dayStart && patient.createdAt < dayEnd).length,
      calls: calls.filter((call) => call.loggedAt >= dayStart && call.loggedAt < dayEnd).length,
      visits: visits.filter((visit) => visit.visitDate >= dayStart && visit.visitDate < dayEnd).length,
      messages: messageRows.filter((message) => message.createdAt >= dayStart && message.createdAt < dayEnd).length,
      completedPrpSessions: prpSessionDetails.filter((session) => session.completed && session.treatmentDate >= dayStart && session.treatmentDate < dayEnd).length,
    };
  });
  const metrics = {
    newBookings: newBookings.length,
    totalBookings,
    todayBookings: newBookings.length,
    uniquePatients: patientKeys.size,
    newPatientRegistrations: newPatients,
    totalRegisteredPatients: totalPatients,
    serviceBookings: blankServiceCounts(newBookings),
    bookingsBySource: bookingSources,
    appointmentOutcomes: statusCounts,
    calls: calls.length,
    totalCalls,
    callDetails: calls.map((call) => ({ loggedAt: call.loggedAt, phone: call.phone, patientName: call.patientName, patientCardNumber: call.patientCardNumber, purpose: call.purpose, serviceName: call.service?.name, linkedBooking: call.booking?.fullName, linkedBookingService: call.booking?.serviceName, staffName: call.staff?.name, outcome: call.outcome, notes: call.notes, followUpRequired: call.followUpRequired })),
    bookingDetails: newBookings.map((booking) => ({ createdAt: booking.createdAt, requestedStartsAt: booking.requestedStartsAt, fullName: booking.fullName, phone: booking.phone, serviceName: booking.serviceName || booking.service?.name, status: booking.status, source: booking.source, approvedBy: bookingApprovers.get(String(booking._id)) })),
    patientDetails: newPatientRows,
    visits: visits.length,
    totalVisits,
    incomingMessages: newMessages,
    totalIncomingMessages: totalMessages,
    prp: { totalCourses: allCourseCount, plannedSessions: sessions.planned, completedSessions: sessions.completed, pendingSessions: Math.max(0, sessions.planned - sessions.completed), coursesCreated: coursesCreated.length, sessionsPlannedInPeriod, sessionsCompletedInPeriod: sessions.completedInPeriod, completionProgress: sessions.planned ? Math.round((sessions.completed / sessions.planned) * 100) : 0 },
    email: emailStatus,
    emailDetails,
    messageDetails: messageRows,
    prpSessionDetails,
    auditDetails: auditRows.map((event) => ({ createdAt: event.createdAt, staffName: event.actorName, role: event.actorRole, action: event.action, entityType: event.entityType })),
    staffActivity,
    visitDetails: visits,
    callsGeneratingBookings,
    followUpsRequired: calls.filter((call) => call.followUpRequired).length,
    completedFollowUps,
    pendingFollowUps,
    dailyTrend: trend,
    comparison: { previousNewBookings: previousBookings, change: newBookings.length - previousBookings, percentChange: previousBookings ? ((newBookings.length - previousBookings) / previousBookings) * 100 : null },
    completeness: "partial",
    dataSourceNotes: ["Booking counts use saved appointment and status-history records.", "Call and reception visit records are entered by staff.", "Email 'accepted' means accepted by the configured provider; delivered counts only include provider-reported delivery statuses.", "Staff activity counts use recorded audit events; older actions that predate audit logging are not inferred."],
  };
  return { period: { type: period.type, label: period.label, start: period.start, end: period.end, timezone: TZ }, metrics };
}

async function generateAndSave(period, actor, { trigger = "manual", scheduleKey } = {}) {
  const metrics = await buildReport(period);
  try {
    return await ClinicReport.create({ type: period.type, periodStart: period.start, periodEnd: period.end, generatedBy: actor?.id, trigger, scheduleKey, metrics, dataCompleteness: "partial" });
  } catch (error) {
    if (error.code === 11000 && scheduleKey) return ClinicReport.findOne({ scheduleKey });
    throw error;
  }
}

module.exports = { TZ, SERVICE_TYPES, getPeriod, buildReport, generateAndSave };
