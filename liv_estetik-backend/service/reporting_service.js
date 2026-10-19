const Booking = require("../models/booking");
const BookingStatusHistory = require("../models/booking_status_history");
const Customer = require("../models/customer");
const CallActivity = require("../models/call_activity");
const SocialPost = require("../models/social_post");
const FollowerObservation = require("../models/follower_observation");
const ClinicReport = require("../models/clinic_report");

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
  const counts = Object.fromEntries(SERVICE_TYPES.map((name) => [name, 0]));
  for (const booking of bookings) {
    const name = normalizedServiceName(booking.serviceName);
    const matched = SERVICE_TYPES.find((serviceName) => normalizedServiceName(serviceName) === name);
    counts[matched || "Other Services"] += 1;
  }
  return counts;
}

async function buildReport(period) {
  const window = { $gte: period.start, $lt: period.end };
  const dayCount = Math.max(1, Math.ceil((period.end - period.start) / DAY));
  const previousStart = period.previousStart;
  const [newBookings, scheduledBookings, cancellations, noShows, calls, posts, newPatients, latestFollower, baselineFollower, periodFollower, followerTrend, previousBookings] = await Promise.all([
    Booking.find({ createdAt: window }).select("customer phone email serviceName source createdAt status").lean(),
    Booking.find({ $or: [{ approvedStartsAt: window }, { requestedStartsAt: window }] }).select("customer status approvedStartsAt requestedStartsAt").lean(),
    BookingStatusHistory.distinct("booking", { toStatus: "cancelled", createdAt: window }),
    BookingStatusHistory.distinct("booking", { toStatus: "no_show", createdAt: window }),
    CallActivity.find({ loggedAt: window }).select("booking outcome followUpRequired").lean(),
    SocialPost.find({ publishedAt: window }).select("platform postUrl platformPostId").lean(),
    Customer.countDocuments({ createdAt: window }),
    FollowerObservation.findOne({ platform: "tiktok" }).sort({ observedAt: -1 }).lean(),
    FollowerObservation.findOne({ platform: "tiktok", observedAt: { $lt: period.start } }).sort({ observedAt: -1 }).lean(),
    FollowerObservation.findOne({ platform: "tiktok", observedAt: window }).sort({ observedAt: -1 }).lean(),
    FollowerObservation.find({ platform: "tiktok", observedAt: window }).select("count observedAt source").sort({ observedAt: 1 }).lean(),
    Booking.countDocuments({ createdAt: { $gte: previousStart, $lt: period.start } }),
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
  const callsGeneratingBookings = new Set(calls.filter((call) => call.booking).map((call) => String(call.booking))).size;
  const postCounts = Object.fromEntries(["tiktok", "instagram", "facebook", "youtube"].map((platform) => [platform, posts.filter((post) => post.platform === platform).length]));
  const followerChange = baselineFollower && periodFollower ? periodFollower.count - baselineFollower.count : null;
  const trend = Array.from({ length: dayCount }, (_, index) => {
    const dayStart = new Date(period.start.getTime() + (index * DAY));
    const dayEnd = new Date(dayStart.getTime() + DAY);
    return {
      date: new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(dayStart),
      newBookings: newBookings.filter((booking) => booking.createdAt >= dayStart && booking.createdAt < dayEnd).length,
      calls: calls.filter((call) => call.loggedAt >= dayStart && call.loggedAt < dayEnd).length,
      posts: posts.filter((post) => post.publishedAt >= dayStart && post.publishedAt < dayEnd).length,
    };
  });
  const metrics = {
    newBookings: newBookings.length,
    uniquePatients: patientKeys.size,
    newPatientRegistrations: newPatients,
    serviceBookings: blankServiceCounts(newBookings),
    bookingsBySource: bookingSources,
    appointmentOutcomes: statusCounts,
    calls: calls.length,
    callsGeneratingBookings,
    followUpsRequired: calls.filter((call) => call.followUpRequired).length,
    postsPublished: posts.length,
    postsByPlatform: postCounts,
    latestTikTokFollowers: latestFollower ? latestFollower.count : null,
    followerChange,
    followerBaselineAvailable: Boolean(baselineFollower),
    followerObservationSource: latestFollower?.source || null,
    followerTrend,
    dailyTrend: trend,
    comparison: { previousNewBookings: previousBookings, change: newBookings.length - previousBookings, percentChange: previousBookings ? ((newBookings.length - previousBookings) / previousBookings) * 100 : null },
    completeness: "partial",
    dataSourceNotes: ["Booking counts use saved appointment and status-history records.", "Call and social activity are manually recorded.", "TikTok follower observations are manual unless explicitly marked API."],
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
