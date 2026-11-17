const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_ROLE_PERMISSIONS, routePermission } = require("../service/permissions");

test("Reception has no call management or export permissions", () => {
  assert.equal(DEFAULT_ROLE_PERMISSIONS.reception.includes("calls.view"), false);
  assert.equal(DEFAULT_ROLE_PERMISSIONS.reception.includes("reports.export"), false);
});

test("Call Center Agent has call access without patient or booking management", () => {
  assert.equal(DEFAULT_ROLE_PERMISSIONS.call_center_agent.includes("calls.view"), true);
  assert.equal(DEFAULT_ROLE_PERMISSIONS.call_center_agent.includes("patients.view"), false);
  assert.equal(DEFAULT_ROLE_PERMISSIONS.call_center_agent.includes("bookings.edit"), false);
});

test("route permissions separate report viewing from exports", () => {
  assert.equal(routePermission({ baseUrl: "/api/admin", path: "/reports/preview", method: "GET" }), "reports.view");
  assert.equal(routePermission({ baseUrl: "/api/admin", path: "/reports/export.csv", method: "GET" }), "reports.export");
  assert.equal(routePermission({ baseUrl: "/api/admin", path: "/audit-logs/export.csv", method: "GET" }), "reports.export");
});
