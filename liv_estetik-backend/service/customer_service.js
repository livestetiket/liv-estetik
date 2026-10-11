const Customer = require("../models/customer");

/**
 * Finds an existing customer by email or phone and updates their info,
 * or creates a new one. Used after booking/contact submissions so we
 * build a customer history without requiring account creation.
 */
async function findOrCreateCustomer({ fullName, email, phone, age, sex, address, source }) {
  let customer = null;

  if (email) {
    customer = await Customer.findOne({ email: email.toLowerCase() });
  }
  if (!customer && phone) {
    customer = await Customer.findOne({ phone });
  }

  if (customer) {
    customer.fullName = fullName || customer.fullName;
    customer.email = email ? email.toLowerCase() : customer.email;
    customer.phone = phone || customer.phone;
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
    age,
    sex,
    address,
    hasAccount: false,
    source,
  });

  return customer;
}

module.exports = { findOrCreateCustomer };