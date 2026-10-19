const Customer = require("../models/customer");

function normalizePhone(value) {
  if (!value) return undefined;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0")) return `251${digits.slice(1)}`;
  return digits;
}

/**
 * Finds an existing customer by email or phone and updates their info,
 * or creates a new one. Used after booking/contact submissions so we
 * build a customer history without requiring account creation.
 */
async function findOrCreateCustomer({ fullName, email, phone, age, sex, address, source }) {
  let customer = null;
  const normalizedPhone = normalizePhone(phone);

  if (normalizedPhone) {
    customer = await Customer.findOne({ $or: [{ normalizedPhone }, { phone }] });
  }
  if (!customer && email) {
    customer = await Customer.findOne({ email: email.toLowerCase() });
  }

  if (customer) {
    customer.fullName = fullName || customer.fullName;
    customer.email = email ? email.toLowerCase() : customer.email;
    customer.phone = phone || customer.phone;
    customer.normalizedPhone = normalizedPhone || customer.normalizedPhone;
    if (age !== undefined) customer.age = age;
    if (sex !== undefined) customer.sex = sex;
    if (address !== undefined) customer.address = address;
    await customer.save();
    return customer;
  }

  customer = await Customer.create({
    fullName,
    email: email ? email.toLowerCase() : undefined,
    phone,
    normalizedPhone,
    age,
    sex,
    address,
    hasAccount: false,
    source,
  });

  return customer;
}

module.exports = { findOrCreateCustomer, normalizePhone };
