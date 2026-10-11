const nodemailer = require("nodemailer");
const env = require("./env");

/**
 * Returns a nodemailer-compatible transporter.
 *
 * - "smtp": uses SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 * - "console": logs emails to the console instead of sending (default, safe for dev)
 *
 * To use SendGrid/Resend/Mailgun via SMTP, just set EMAIL_PROVIDER=smtp
 * and point SMTP_HOST/SMTP_USER/SMTP_PASS at that provider's SMTP relay.
 */
function buildTransporter() {
  if (env.emailProvider === "smtp" && env.smtpHost) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser
        ? { user: env.smtpUser, pass: env.smtpPass }
        : undefined,
    });
  }

  // Fallback "console" transport: does not actually send email.
  // Useful for local development without email provider credentials.
  return {
    sendMail: async (options) => {
      // eslint-disable-next-line no-console
      console.log("\n[mail:console] ---- Email would be sent ----");
      // eslint-disable-next-line no-console
      console.log(`To: ${options.to}`);
      // eslint-disable-next-line no-console
      console.log(`Subject: ${options.subject}`);
      // eslint-disable-next-line no-console
      console.log(`Body:\n${options.text || options.html}`);
      // eslint-disable-next-line no-console
      console.log("-------------------------------------------\n");
      return { messageId: `console-${Date.now()}` };
    },
  };
}

const transporter = buildTransporter();

module.exports = transporter;