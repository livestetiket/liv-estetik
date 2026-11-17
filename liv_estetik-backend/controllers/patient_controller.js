const Customer = require("../models/customer");
const PrpCourse = require("../models/prp_course");
const ApiError = require("../util/api_error");
const asyncHandler = require("../util/async_handler");
const { normalizePhone, createPatientRecord, updatePatientIdentity } = require("../service/customer_service");
const { logAction } = require("../service/audit_service");
const { notifyRoles } = require("../service/notification_service");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const editablePatientFields = ["fullName", "email", "phone", "age", "sex", "address", "notes"];

const listPatients = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 120);
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const filter = {};
  if (q) {
    const safe = escapeRegex(q);
    const normalizedPhone = normalizePhone(q);
    const normalizedEmail = q.includes("@") ? q.toLowerCase() : null;
    filter.$or = [
      { fullName: { $regex: safe, $options: "i" } },
      { cardNumber: { $regex: safe, $options: "i" } },
      { phone: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
      ...(normalizedPhone ? [{ normalizedPhone }] : []),
      ...(normalizedEmail ? [{ normalizedEmail }] : []),
    ];
  }
  const [rows, total] = await Promise.all([
    Customer.find(filter).select("fullName email phone cardNumber age sex address notes createdAt updatedAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);
  res.json({ data: rows, meta: { total, page, limit } });
});

const lookupPatient = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  const email = String(req.query.email || "").trim().toLowerCase();
  const filter = [];
  if (phone) filter.push({ $or: [{ normalizedPhone: phone }, { phone: req.query.phone }] });
  if (email) filter.push({ $or: [{ normalizedEmail: email }, { email }] });
  if (!filter.length) return res.json({ data: [] });
  const rows = await Customer.find(filter.length === 1 ? filter[0] : { $or: filter })
    .select("fullName phone email cardNumber createdAt")
    .sort({ createdAt: -1 }).limit(10).lean();
  res.json({ data: rows });
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await Customer.findById(req.params.id).select("fullName email phone cardNumber age sex address notes createdAt updatedAt").lean();
  if (!patient) throw ApiError.notFound("Patient not found");
  const courses = await PrpCourse.find({ patient: patient._id }).populate("createdBy", "name role").populate("sessions.createdBy", "name role").populate("sessions.updatedBy", "name role").populate("history.changedBy", "name role").sort({ courseNumber: 1 }).lean();
  res.json({ data: { patient, prpCourses: courses } });
});

const createPatient = asyncHandler(async (req, res) => {
  const patient = await createPatientRecord({ ...req.body, source: "manual" });
  await logAction({ actor: req.user, action: "patient.registered", entityType: "Customer", entityId: patient._id, metadata: { cardNumber: patient.cardNumber, source: "manual" } });
  await notifyRoles({ eventKey: `patient.registered:${patient._id}`, eventType: "patient.registered", title: "New patient registered", message: `${patient.fullName} was registered.`, entityType: "Customer", entityId: patient._id });
  res.status(201).json({ data: patient });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Customer.findById(req.params.id);
  if (!patient) throw ApiError.notFound("Patient not found");
  const changes = {};
  for (const field of editablePatientFields) {
    if (req.body[field] !== undefined && req.body[field] !== patient[field]) changes[field] = { previous: patient[field] ?? null, updated: req.body[field] ?? null };
  }
  if (!Object.keys(changes).length) return res.json({ data: patient });
  for (const [field, change] of Object.entries(changes)) {
    if (field !== "email" && field !== "phone") patient[field] = change.updated ?? undefined;
  }
  if (changes.email || changes.phone) {
    await updatePatientIdentity(patient, changes.email ? changes.email.updated : patient.email, changes.phone ? changes.phone.updated : patient.phone);
  } else {
    await patient.save();
  }
  await logAction({ actor: req.user, action: "patient.updated", entityType: "Customer", entityId: patient._id, metadata: { fields: changes } });
  res.json({ data: patient });
});

const createPrpCourse = asyncHandler(async (req, res) => {
  const patient = await Customer.findById(req.params.id).select("_id");
  if (!patient) throw ApiError.notFound("Patient not found");
  const courseNumber = (await PrpCourse.countDocuments({ patient: patient._id })) + 1;
  const sessions = Array.from({ length: 6 }, (_, index) => ({ sessionNumber: index + 1, createdBy: req.user.id }));
  const course = await PrpCourse.create({ patient: patient._id, courseNumber, title: req.body.title || `PRP course ${courseNumber}`, sessions, createdBy: req.user.id });
  await logAction({ actor: req.user, action: "prp.course_created", entityType: "PrpCourse", entityId: course._id, metadata: { patientId: patient._id, courseNumber } });
  res.status(201).json({ data: course });
});

const updatePrpSession = asyncHandler(async (req, res) => {
  const number = Number(req.params.sessionNumber);
  if (!Number.isInteger(number) || number < 1 || number > 6) throw ApiError.badRequest("Session number must be between 1 and 6.");
  const course = await PrpCourse.findOne({ _id: req.params.courseId, patient: req.params.id });
  if (!course) throw ApiError.notFound("PRP course not found");
  const session = course.sessions.find((row) => row.sessionNumber === number);
  if (!session) throw ApiError.notFound("PRP session not found");
  const previous = { date: session.treatmentDate || null, completed: Boolean(session.completed) };
  if (req.body.treatmentDate !== undefined) session.treatmentDate = req.body.treatmentDate || undefined;
  if (req.body.completed !== undefined) session.completed = req.body.completed;
  const updated = { date: session.treatmentDate || null, completed: Boolean(session.completed) };
  session.updatedBy = req.user.id;
  session.updatedAt = new Date();
  course.history.push({ sessionNumber: number, changedBy: req.user.id, changedAt: new Date(), previous, updated });
  await course.save();
  await logAction({ actor: req.user, action: "prp.session_updated", entityType: "PrpCourse", entityId: course._id, metadata: { patientId: req.params.id, sessionNumber: number, previous, updated } });
  res.json({ data: course });
});

module.exports = { listPatients, lookupPatient, getPatient, createPatient, updatePatient, createPrpCourse, updatePrpSession };
