const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePhone, normalizeEmail, identityKeys } = require("../service/customer_service");

test("phone normalization handles Ethiopian trunk zero and formatting", () => {
  assert.equal(normalizePhone("0911 504 002"), "251911504002");
  assert.equal(normalizePhone("+251 (911) 504-002"), "251911504002");
  assert.equal(normalizePhone("---"), undefined);
});

test("identity keys normalize email and keep optional identifiers optional", () => {
  assert.deepEqual(identityKeys({ email: "  Patient@Example.com ", phone: "0911 504 002" }), ["email:patient@example.com", "phone:251911504002"]);
  assert.deepEqual(identityKeys({ fullName: "Same Name" }), []);
  assert.deepEqual(identityKeys({ email: "", phone: "" }), []);
  assert.equal(normalizeEmail("  PATIENT@EXAMPLE.COM "), "patient@example.com");
  assert.equal(normalizeEmail(""), undefined);
});
