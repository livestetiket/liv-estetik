const transporter = require("../config/mail");
const env = require("../config/env");
const EmailNotification = require("../models/email_notification");
const { logAction } = require("./audit_service");

function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Addis_Ababa" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}

const TEMPLATE_COPY = {
  booking_approved: { subject: `Your ${env.clinicName} appointment is confirmed`, status: "Approved", intro: "Your appointment has been approved." },
  booking_rejected: { subject: `An update about your ${env.clinicName} appointment`, status: "Not approved", intro: "We are unable to confirm this appointment request." },
  booking_rescheduled: { subject: `Your ${env.clinicName} appointment time has changed`, status: "Rescheduled", intro: "Your appointment time has been updated." },
};

function buildBookingEmail(template, booking) {
  const copy = TEMPLATE_COPY[template];
  const when = formatDateTime(booking.approvedStartsAt || booking.requestedStartsAt);
  const service = booking.serviceName || booking.service?.name || "Selected service";
  const reference = String(booking._id || booking.id || "");
  const cardNumber = booking.customer?.cardNumber;
  const text = [
    `Hello ${booking.fullName}`, "", copy.intro, "", `Booking reference: ${reference}`,
    cardNumber ? `Patient card number: ${cardNumber}` : null,
    `Confirmation status: ${copy.status}`, `Service: ${service}`, `Appointment: ${when}`,
    booking.staffMessage ? `Note from the clinic: ${booking.staffMessage}` : null,
    "", env.clinicName, env.clinicAddress, `Phone: ${env.clinicPhone}`,
  ].filter(Boolean).join("\n");
  const rows = [
    ["Booking reference", reference], ...(cardNumber ? [["Patient card number", cardNumber]] : []),
    ["Confirmation status", copy.status], ["Service", service], ["Appointment", when],
  ].map(([label, value]) => `<tr><td style="padding:10px 12px;color:#65716b;border-bottom:1px solid #e8ece9">${escapeHtml(label)}</td><td style="padding:10px 12px;color:#18352d;font-weight:600;border-bottom:1px solid #e8ece9">${escapeHtml(value)}</td></tr>`).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f4f0;font-family:Arial,sans-serif;color:#23352f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f4f0;padding:28px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e5e4dd;border-radius:12px;overflow:hidden"><tr><td style="background:#173b31;padding:24px 30px;color:#fff"><div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#d5c49a">Liv Estetik</div><div style="font-size:23px;font-weight:700;margin-top:9px">Appointment update</div></td></tr><tr><td style="padding:28px 30px"><p style="margin:0 0 12px;font-size:18px;color:#173b31">Hello ${escapeHtml(booking.fullName)},</p><p style="margin:0 0 20px;line-height:1.6">${escapeHtml(copy.intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fbfbf9">${rows}</table>${booking.staffMessage ? `<p style="margin:20px 0 0;line-height:1.6"><strong>Note from our team:</strong> ${escapeHtml(booking.staffMessage)}</p>` : ""}</td></tr><tr><td style="background:#f8f8f5;padding:20px 30px;font-size:13px;line-height:1.7;color:#58645e"><strong style="color:#173b31">${escapeHtml(env.clinicName)}</strong><br>${escapeHtml(env.clinicAddress)}<br>Phone: ${escapeHtml(env.clinicPhone)}</td></tr></table></td></tr></table></body></html>`;
  return { subject: copy.subject, text, html };
}

function idempotencyKey(template, booking) {
  if (template === "booking_approved") return `${template}:${booking._id}`;
  return `${template}:${booking._id}:${new Date(booking.decisionAt || booking.updatedAt || Date.now()).getTime()}`;
}

function safeFailure(error) {
  const code = error?.code ? String(error.code).slice(0, 40) : "EMAIL_SEND_FAILED";
  const responseCode = error?.responseCode ? ` (${error.responseCode})` : "";
  return `${code}${responseCode}: Email provider did not accept this message.`;
}

async function deliver(notificationId, actor) {
  const record = await EmailNotification.findOneAndUpdate(
    { _id: notificationId, status: { $in: ["queued", "failed"] } },
    { $set: { status: "sending", lastAttemptAt: new Date(), lastAttemptBy: actor?.id }, $inc: { attempts: 1 } },
    { new: true },
  );
  if (!record) return EmailNotification.findById(notificationId);
  try {
    if (env.emailProvider === "smtp" && !env.emailFrom) throw new Error("EMAIL_FROM is required when EMAIL_PROVIDER=smtp.");
    const info = await transporter.sendMail({ from: env.emailFrom || env.clinicName, to: record.to, subject: record.subject, text: record.message, html: record.html });
    if (Array.isArray(info.accepted) && info.accepted.length === 0) throw new Error("Provider rejected the recipient.");
    if (env.emailProvider === "console") {
      record.status = "simulated";
      record.error = "Console mode logged this email; no message was delivered.";
    } else {
      record.status = "sent";
      record.providerMessageId = info.messageId;
      record.sentAt = new Date();
      record.error = undefined;
    }
  } catch (error) {
    record.status = "failed";
    record.error = safeFailure(error);
  }
  record.attemptHistory.push({ attempt: record.attempts, attemptedAt: record.lastAttemptAt || new Date(), status: record.status, actor: actor?.id, providerMessageId: record.providerMessageId });
  await record.save();
  await logAction({ actor: actor || { role: "system", name: "Email service" }, action: "email.send_attempt", entityType: "EmailNotification", entityId: record._id, metadata: { template: record.template, status: record.status, attempt: record.attempts } });
  return record;
}

async function sendBookingEmail(template, booking, actor) {
  if (!TEMPLATE_COPY[template]) throw new Error(`Unknown email template: ${template}`);
  const { subject, text, html } = buildBookingEmail(template, booking);
  const key = idempotencyKey(template, booking);
  let record;
  try {
    record = await EmailNotification.create({ to: booking.email, subject, template, status: "queued", booking: booking._id, message: text, html, idempotencyKey: key, createdBy: actor?.id });
  } catch (error) {
    if (error.code !== 11000) throw error;
    record = await EmailNotification.findOne({ idempotencyKey: key });
    if (!record || record.status !== "failed") return record;
  }
  return deliver(record._id, actor);
}

async function retryEmailNotification(notificationId, actor) {
  const record = await EmailNotification.findById(notificationId);
  if (!record) return null;
  if (record.status !== "failed") return record;
  return deliver(record._id, actor);
}

module.exports = { sendBookingEmail, retryEmailNotification, buildBookingEmail };
