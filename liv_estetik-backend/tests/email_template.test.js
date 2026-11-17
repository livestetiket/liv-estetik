process.env.NODE_ENV = "test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildBookingEmail } = require("../service/email_service");

test("booking confirmation contains reference, card, clinic details, and escaped HTML", () => {
  const email = buildBookingEmail("booking_approved", {
    _id: "booking-123",
    fullName: "<Script>Patient</Script>",
    email: "patient@example.com",
    serviceName: "PRP Treatment",
    requestedStartsAt: "2026-11-20T07:00:00.000Z",
    customer: { cardNumber: "LE-2026-000001" },
    staffMessage: "Please arrive early & call us.",
  });
  assert.match(email.subject, /appointment is confirmed/i);
  assert.match(email.text, /booking-123/);
  assert.match(email.text, /LE-2026-000001/);
  assert.match(email.text, /PRP Treatment/);
  assert.match(email.html, /&lt;Script&gt;Patient&lt;\/Script&gt;/);
  assert.doesNotMatch(email.html, /<Script>/);
  assert.match(email.html, /&amp;/);
});
