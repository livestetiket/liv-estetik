const Customer = require("../models/customer");
const ApiError = require("../util/api_error");
const CustomerIdentity = require("../models/customer_identity");

function normalizePhone(value) {
  if (!value) return undefined;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0")) return `251${digits.slice(1)}`;
  return digits;
}

function normalizeEmail(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed || undefined;
}

function identityKeys({ email, phone }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  return [normalizedEmail ? `email:${normalizedEmail}` : null, normalizedPhone ? `phone:${normalizedPhone}` : null].filter(Boolean);
}

function candidateIdentityValues({ email, phone }) {
  const values = new Set();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedEmail) {
    values.add(normalizedEmail);
    values.add(String(email || "").trim().toLowerCase());
  }

  if (normalizedPhone) {
    values.add(normalizedPhone);
    values.add(`0${normalizedPhone.slice(3)}`);
    values.add(String(phone || "").trim());
    values.add(String(phone || "").replace(/\D/g, ""));
  }

  return [...values].filter(Boolean);
}

function buildIdentityMatchClauses({ email, phone }) {
  const clauses = [];
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const emailCandidates = new Set([normalizedEmail, normalizeEmail(email)].filter(Boolean));
  const rawPhone = phone === undefined || phone === null ? "" : String(phone).trim();
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const phoneCandidates = new Set([
    normalizedPhone,
    rawPhone,
    phoneDigits,
    normalizedPhone ? `0${normalizedPhone.slice(3)}` : "",
  ].filter(Boolean));

  if (normalizedEmail) {
    clauses.push({ normalizedEmail }, { email: normalizedEmail });
  }
  for (const value of emailCandidates) {
    if (value) clauses.push({ email: value });
  }

  if (normalizedPhone) {
    clauses.push({ normalizedPhone }, { phone: normalizedPhone });
  }
  for (const value of phoneCandidates) {
    if (value) clauses.push({ phone: value });
  }

  return clauses.filter((clause) => Object.keys(clause).length > 0);
}

async function identitiesFor(keys) {
  if (!keys.length) return [];
  return CustomerIdentity.find({ key: { $in: keys } }).select("key customer").lean();
}

async function reserveIdentities(customerId, keys) {
  const existing = await identitiesFor(keys);
  if (existing.some((identity) => !identity.customer.equals(customerId))) {
    throw ApiError.conflict("This email or phone number is already associated with another patient record. Select the correct record or correct the contact details.");
  }
  for (const key of keys) {
    if (existing.some((identity) => identity.key === key)) continue;
    try {
      await CustomerIdentity.create({ key, customer: customerId });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const winner = await CustomerIdentity.findOne({ key }).select("customer").lean();
      if (!winner?.customer.equals(customerId)) {
        throw ApiError.conflict("Another staff member saved this patient contact information at the same time. Search and select the saved patient record.");
      }
    }
  }
}

/**
 * Finds an existing customer by email or phone and updates their info,
 * or creates a new one. Used after booking/contact submissions so we
 * build a customer history without requiring account creation.
 */
async function findOrCreateCustomer({ fullName, email, phone, age, sex, address, source }) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const keys = identityKeys({ email: normalizedEmail, phone: normalizedPhone });

  const candidateMatches = await Customer.find({
    $or: buildIdentityMatchClauses({ email: normalizedEmail, phone: normalizedPhone }).slice(0, 10),
  }).select("_id fullName email phone normalizedEmail normalizedPhone").lean();

  let customer = null;
  if (candidateMatches.length > 0) {
    const distinctMatches = [...new Map(candidateMatches.map((row) => [String(row._id), row])).values()];
    if (distinctMatches.length > 1) {
      throw ApiError.conflict("The supplied contact details match more than one patient record. Search for the correct record or correct the contact details.");
    }
    customer = await Customer.findById(distinctMatches[0]._id);
  }

  if (customer) {
    const nextKeys = identityKeys({ email: normalizedEmail || customer.email, phone: normalizedPhone || customer.phone });
    await reserveIdentities(customer._id, nextKeys);
    const safeFullName = fullName && fullName.trim() ? fullName.trim() : customer.fullName;
    customer.fullName = safeFullName;
    customer.email = normalizedEmail || customer.email;
    customer.normalizedEmail = normalizedEmail || customer.normalizedEmail;
    customer.phone = phone && phone.trim() ? phone.trim() : customer.phone;
    customer.normalizedPhone = normalizedPhone || customer.normalizedPhone;
    if (age !== undefined) customer.age = age;
    if (sex !== undefined) customer.sex = sex;
    if (address !== undefined) customer.address = address;
    await customer.save();
    await CustomerIdentity.deleteMany({ customer: customer._id, key: { $nin: nextKeys } });
    return customer;
  }

  const created = await Customer.create({
    fullName,
    email: normalizedEmail,
    normalizedEmail,
    phone: phone && phone.trim() ? phone.trim() : undefined,
    normalizedPhone,
    age,
    sex,
    address,
    hasAccount: false,
    source,
  });
  created.$locals.createdForThisRequest = true;

  try {
    await reserveIdentities(created._id, keys);
  } catch (error) {
    await CustomerIdentity.deleteMany({ customer: created._id });
    await Customer.deleteOne({ _id: created._id });
    throw error;
  }

  return created;
}

async function createPatientRecord(payload) {
  const normalizedPhone = normalizePhone(payload.phone);
  const normalizedEmail = normalizeEmail(payload.email);
  const keys = identityKeys({ email: normalizedEmail, phone: normalizedPhone });
  const directMatches = await Customer.find({
    $or: buildIdentityMatchClauses({ email: normalizedEmail, phone: normalizedPhone }),
  }).select("_id").limit(2);
  const reserved = await identitiesFor(keys);
  if (directMatches.length || reserved.length) {
    throw ApiError.conflict("A patient record with this email or phone was registered already. Search for the existing record or verify the contact details.");
  }
  const customer = await Customer.create({
    ...payload,
    email: normalizedEmail,
    normalizedEmail,
    phone: payload.phone && payload.phone.trim() ? payload.phone.trim() : undefined,
    normalizedPhone,
    source: payload.source || "manual",
  });
  try {
    await reserveIdentities(customer._id, keys);
  } catch (error) {
    await CustomerIdentity.deleteMany({ customer: customer._id });
    await Customer.deleteOne({ _id: customer._id });
    throw error;
  }
  customer.$locals.createdForThisRequest = true;
  return customer;
}

async function updatePatientIdentity(customer, nextEmail, nextPhone) {
  const normalizedEmail = normalizeEmail(nextEmail);
  const normalizedPhone = normalizePhone(nextPhone);
  const keys = identityKeys({ email: normalizedEmail, phone: normalizedPhone });
  const directMatches = await Customer.find({ _id: { $ne: customer._id }, $or: buildIdentityMatchClauses({ email: normalizedEmail, phone: normalizedPhone }) }).select("_id").limit(1);
  if (directMatches.length) throw ApiError.conflict("This email or phone number is already associated with another patient record.");
  await reserveIdentities(customer._id, keys);
  customer.email = normalizedEmail;
  customer.normalizedEmail = normalizedEmail;
  customer.phone = nextPhone && nextPhone.trim() ? nextPhone.trim() : undefined;
  customer.normalizedPhone = normalizedPhone;
  await customer.save();
  await CustomerIdentity.deleteMany({ customer: customer._id, key: { $nin: keys } });
}

module.exports = { findOrCreateCustomer, createPatientRecord, normalizePhone, normalizeEmail, identityKeys, updatePatientIdentity };
