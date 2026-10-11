const transporter = require("../config/mail");
const env = require("../config/env");
const EmailNotification = require("../models/email_notification");

function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function clinicSignature() {
  return [
    `${env.clinicName}`,
    env.clinicAddress ? env.clinicAddress : null,
    env.clinicPhone ? `Phone: ${env.clinicPhone}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildApprovedEmail({ booking }) {
  const subject = `Your ${env.clinicName} appointment has been approved`;
  const services = booking.serviceName || "your selected service";
  const body = [
    `Hi ${booking.fullName},`,
    "",
    `Great news — your appointment request has been approved.`,
    "",
    `Services: ${services}`,
    `Date & time: ${formatDateTime(booking.approvedStartsAt || booking.requestedStartsAt)}`,
    booking.staffMessage ? `\nNote from our team: ${booking.staffMessage}` : "",
    "",
    clinicSignature(),
  ]
    .filter((line) => line !== "")
    .join("\n");
  return { subject, body };
}

function buildRejectedEmail({ booking }) {
  const subject = `Update on your ${env.clinicName} booking request`;
  const services = booking.serviceName || "your selected service";
  const body = [
    `Hi ${booking.fullName},`,
    "",
    `We're sorry, but we're unable to confirm your requested appointment at this time.`,
    "",
    `Services: ${services}`,
    `Reason: ${booking.staffMessage || "Not specified"}`,
    "",
    `Please feel free to submit a new booking request or contact us directly so we can help find a suitable time.`,
    "",
    clinicSignature(),
  ].join("\n");
  return { subject, body };
}

function buildRescheduledEmail({ booking }) {
  const subject = `Your ${env.clinicName} appointment time has changed`;
  const services = booking.serviceName || "your selected service";
  const body = [
    `Hi ${booking.fullName},`,
    "",
    `We need to adjust the time for your upcoming appointment.`,
    "",
    `Services: ${services}`,
    `Originally requested: ${formatDateTime(booking.requestedStartsAt)}`,
    `New proposed time: ${formatDateTime(booking.approvedStartsAt)}`,
    booking.staffMessage ? `Reason: ${booking.staffMessage}` : "",
    "",
    `If this new time doesn't work for you, please contact us and we'll help find another slot.`,
    "",
    clinicSignature(),
  ]
    .filter((line) => line !== "")
    .join("\n");
  return { subject, body };
}

const TEMPLATE_BUILDERS = {
  booking_approved: buildApprovedEmail,
  booking_rejected: buildRejectedEmail,
  booking_rescheduled: buildRescheduledEmail,
};

/**
 * Sends a booking notification email and persists an EmailNotification
 * record regardless of success/failure, per docs section 9.4:
 * failures must never be silently ignored.
 */
async function sendBookingEmail(template, booking) {
  const builder = TEMPLATE_BUILDERS[template];
  if (!builder) {
    throw new Error(`Unknown email template: ${template}`);
  }

  const { subject, body } = builder({ booking });

  const record = await EmailNotification.create({
    to: booking.email,
    subject,
    template,
    status: "queued",
    booking: booking._id,
    message: body,
  });

  try {
    const info = await transporter.sendMail({
      from: env.emailFrom,
      to: booking.email,
      subject,
      text: body,
    });

    record.status = "sent";
    record.providerMessageId = info.messageId;
    record.sentAt = new Date();
    await record.save();
  } catch (err) {
    record.status = "failed";
    record.error = err.message;
    await record.save();
    // Do not throw: the booking action itself already succeeded.
    // The failure is visible in the dashboard via EmailNotification.status.
  }

  return record;
}

/**
 * Retries sending a previously failed/queued email notification.
 */
async function retryEmailNotification(notificationId) {
  const record = await EmailNotification.findById(notificationId);
  if (!record) return null;

  try {
    const info = await transporter.sendMail({
      from: env.emailFrom,
      to: record.to,
      subject: record.subject,
      text: record.message,
    });
    record.status = "sent";
    record.providerMessageId = info.messageId;
    record.sentAt = new Date();
    record.error = undefined;
  } catch (err) {
    record.status = "failed";
    record.error = err.message;
  }

  await record.save();
  return record;
}

module.exports = { sendBookingEmail, retryEmailNotification };