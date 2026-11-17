const BUILTIN_ROLES = ["admin", "reception", "call_center_agent"];
const PERMISSIONS = [
  "overview.view", "patients.view", "patients.create", "patients.edit", "patients.delete",
  "bookings.view", "bookings.create", "bookings.edit", "bookings.delete", "bookings.approve", "bookings.cancel",
  "prp.view", "prp.manage", "daily_visits.view", "daily_visits.create", "daily_visits.edit",
  "calls.view", "calls.create", "calls.edit", "calls.assign", "testimonials.view", "testimonials.manage",
  "messages.view", "messages.edit", "time_slots.view", "time_slots.manage", "services.view", "services.manage",
  "emails.view", "emails.retry", "reports.view", "reports.export", "audit_logs.view", "users.view", "users.create",
  "users.edit", "users.delete", "roles.view", "roles.create", "roles.edit", "roles.assign", "notifications.view", "settings.manage",
];

const DEFAULT_ROLE_PERMISSIONS = {
  admin: PERMISSIONS,
  reception: ["overview.view", "patients.view", "patients.create", "patients.edit", "bookings.view", "bookings.create", "bookings.edit", "bookings.approve", "bookings.cancel", "prp.view", "prp.manage", "daily_visits.view", "daily_visits.create", "daily_visits.edit", "testimonials.view", "testimonials.manage", "messages.view", "messages.edit", "time_slots.view", "time_slots.manage", "services.view", "reports.view", "notifications.view"],
  call_center_agent: ["overview.view", "calls.view", "calls.create", "calls.edit", "notifications.view"],
};

function normalizeRolePermissions(role, assigned = []) {
  return DEFAULT_ROLE_PERMISSIONS[role] || assigned;
}

function routePermission(req) {
  const path = `${req.baseUrl || ""}${req.path || ""}`.toLowerCase();
  const method = req.method.toUpperCase();
  const action = method === "GET" ? "view" : method === "POST" ? "create" : method === "DELETE" ? "delete" : "edit";
  if (/\/patients\/[^/]+\/prp-courses/.test(path)) return method === "GET" ? "prp.view" : "prp.manage";
  if (path.includes("/patients")) return `patients.${action}`;
  if (path.includes("/calls")) return `calls.${method === "GET" ? "view" : method === "POST" ? "create" : "edit"}`;
  if (path.includes("/bookings")) {
    if (path.includes("/approve")) return "bookings.approve";
    if (path.includes("/cancel") || path.includes("/reject")) return "bookings.cancel";
    return `bookings.${action}`;
  }
  if (path.includes("/visits")) return `daily_visits.${action}`;
  if (path.includes("/testimonials")) return method === "GET" ? "testimonials.view" : "testimonials.manage";
  if (path.includes("/messages")) return method === "GET" ? "messages.view" : "messages.edit";
  if (path.includes("/time-slots")) return method === "GET" ? "time_slots.view" : "time_slots.manage";
  if (path.includes("/services")) return method === "GET" ? "services.view" : "services.manage";
  if (path.includes("/email-notifications")) return path.includes("/retry") ? "emails.retry" : "emails.view";
  if (path.includes("/audit-logs/export")) return "reports.export";
  if (path.includes("/audit-logs")) return "audit_logs.view";
  if (path.includes("/reports/export") || /\/reports\/[^/]+\/share-opened/.test(path)) return "reports.export";
  if (path.includes("/reports")) return "reports.view";
  if (path.includes("/clinic-settings")) return "settings.manage";
  if (path.includes("/notifications")) return "notifications.view";
  if (path.includes("/users")) return `users.${action === "view" ? "view" : action === "create" ? "create" : action}`;
  if (path.includes("/roles")) return method === "GET" ? "roles.view" : method === "POST" ? "roles.create" : "roles.edit";
  if (path.endsWith("/dashboard")) return "overview.view";
  return null;
}

module.exports = { BUILTIN_ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, normalizeRolePermissions, routePermission };
