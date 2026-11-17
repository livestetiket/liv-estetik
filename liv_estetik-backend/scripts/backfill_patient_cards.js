const connectDB = require("../config/db");
const Customer = require("../models/customer");
const Sequence = require("../models/sequence");
const CustomerIdentity = require("../models/customer_identity");
const { normalizePhone } = require("../service/customer_service");

async function nextCardNumber(year) {
  for (;;) {
    const row = await Sequence.findOneAndUpdate(
      { key: `patient-card-${year}` },
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const cardNumber = `LE-${year}-${String(row.value).padStart(6, "0")}`;
    if (!await Customer.exists({ cardNumber })) return cardNumber;
  }
}

async function main() {
  await connectDB();
  let updated = 0;
  let identityConflicts = 0;
  const cursor = Customer.find({ $or: [{ cardNumber: { $exists: false } }, { cardNumber: null }, { cardNumber: "" }] }).sort({ createdAt: 1, _id: 1 }).cursor();
  for await (const customer of cursor) {
    const year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Africa/Addis_Ababa" }).format(customer.createdAt || new Date()));
    customer.cardNumber = await nextCardNumber(year);
    customer.normalizedPhone = normalizePhone(customer.phone);
    customer.normalizedEmail = customer.email ? customer.email.trim().toLowerCase() : undefined;
    await customer.save();
    updated += 1;
  }
  const known = Customer.find({ cardNumber: { $exists: true, $ne: null } }).cursor();
  for await (const customer of known) {
    const phone = normalizePhone(customer.phone);
    const email = customer.email ? customer.email.trim().toLowerCase() : undefined;
    if (customer.normalizedPhone !== phone || customer.normalizedEmail !== email) {
      customer.normalizedPhone = phone;
      customer.normalizedEmail = email;
      await customer.save();
      updated += 1;
    }
    const keys = [email ? `email:${email}` : null, phone ? `phone:${phone}` : null].filter(Boolean);
    for (const key of keys) {
      try {
        await CustomerIdentity.create({ key, customer: customer._id });
      } catch (error) {
        if (error.code !== 11000) throw error;
        const existing = await CustomerIdentity.findOne({ key }).select("customer").lean();
        if (!existing?.customer.equals(customer._id)) identityConflicts += 1;
      }
    }
  }
  console.log(`[migration] Updated ${updated} patient records; existing card numbers were preserved. Identity conflicts retained without merging: ${identityConflicts}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("[migration] Patient-card backfill failed:", error.message);
  process.exit(1);
});
