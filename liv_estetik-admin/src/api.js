const TOKEN_KEY = "liv_estetik_token";
const USER_KEY = "liv_estetik_user";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

let authToken = null;

function getHeaders(extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: getHeaders(options.headers || {}),
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.message || body?.error || response.statusText || "Request failed";
    throw new Error(message);
  }

  return body;
}

function normalizeIds(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map(normalizeIds);
  }
  if (typeof value === "object") {
    const normalized = { ...value };
    if (!("id" in normalized) && normalized._id) {
      normalized.id = normalized._id;
    }
    for (const key of Object.keys(normalized)) {
      normalized[key] = normalizeIds(normalized[key]);
    }
    return normalized;
  }
  return value;
}

function parseData(body) {
  const parsed = body?.data ?? body;
  return normalizeIds(parsed);
}

export function setAuthToken(token) {
  authToken = token;
}

export function getStoredSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }
  return { token, user };
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  authToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email, password) {
  const body = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const { token, user } = body;
  if (!token || !user) {
    throw new Error("Invalid login response from backend.");
  }

  setAuthToken(token);
  saveSession(token, user);
  return { token, user };
}

export async function fetchCurrentUser(token) {
  if (token) {
    setAuthToken(token);
  }
  const body = await request("/api/auth/me");
  const data = parseData(body);
  if (!data) {
    throw new Error("Invalid session token.");
  }
  return data;
}

export async function getDashboardSummary(role) {
  const path = role === "admin" ? "/api/admin/dashboard" : "/api/reception/dashboard";
  const body = await request(path);
  return parseData(body) || {};
}

export async function getClinicSettings() {
  return parseData(await request("/api/admin/clinic-settings"));
}

export async function updateClinicSettings(payload) {
  return parseData(await request("/api/admin/clinic-settings", { method: "PUT", body: JSON.stringify(payload) }));
}

export async function getBookings(role) {
  const path = role === "admin" ? "/api/admin/bookings" : "/api/reception/bookings";
  const body = await request(`${path}?limit=100`);
  return parseData(body) || [];
}

export async function getBookableServices() {
  return parseData(await request("/api/services")) || [];
}

export async function getAvailableSlots(from, to, serviceId) {
  const params = new URLSearchParams({ from, to });
  if (serviceId) params.set("serviceIds", serviceId);
  return parseData(await request(`/api/time-slots?${params}`)) || [];
}

export async function createReceptionBooking(payload) {
  return parseData(await request("/api/reception/bookings", { method: "POST", body: JSON.stringify(payload) }));
}

export async function lookupPatient(phone) {
  const params = new URLSearchParams();
  if (phone) params.set("phone", phone);
  return parseData(await request(`/api/patients/lookup?${params}`)) || [];
}

export async function searchPatientMatches(phone, email) {
  const params = new URLSearchParams();
  if (phone) params.set("phone", phone);
  if (email) params.set("email", email);
  return parseData(await request(`/api/patients/lookup?${params}`)) || [];
}

export async function getPatients(q = "") {
  const params = new URLSearchParams({ limit: "100" });
  if (q) params.set("q", q);
  return parseData(await request(`/api/patients?${params}`)) || [];
}

export async function getPatient(id) {
  return parseData(await request(`/api/patients/${id}`));
}

export async function createPatient(payload) {
  return parseData(await request("/api/patients", { method: "POST", body: JSON.stringify(payload) }));
}

export async function updatePatient(id, payload) {
  return parseData(await request(`/api/patients/${id}`, { method: "PATCH", body: JSON.stringify(payload) }));
}

export async function createPrpCourse(patientId, title) {
  return parseData(await request(`/api/patients/${patientId}/prp-courses`, { method: "POST", body: JSON.stringify({ title }) }));
}

export async function updatePrpSession(patientId, courseId, sessionNumber, patch) {
  return parseData(await request(`/api/patients/${patientId}/prp-courses/${courseId}/sessions/${sessionNumber}`, { method: "PATCH", body: JSON.stringify(patch) }));
}

export async function updateBookingStatus(id, status) {
  return parseData(await request(`/api/reception/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }));
}

export async function getBooking(role, id) {
  const path = role === "admin" ? "/api/admin/bookings" : "/api/reception/bookings";
  const body = await request(`${path}/${id}`);
  return parseData(body);
}

export async function approveBooking(role, id, message = "") {
  const prefix = role === "admin" ? "/api/admin" : "/api/reception";
  const body = await request(`${prefix}/bookings/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ message }),
  });
  return parseData(body);
}

export async function rejectBooking(role, id, reason) {
  const prefix = role === "admin" ? "/api/admin" : "/api/reception";
  const body = await request(`${prefix}/bookings/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return parseData(body);
}

export async function rescheduleBooking(role, id, newSlot, reason) {
  const prefix = role === "admin" ? "/api/admin" : "/api/reception";
  const body = await request(`${prefix}/bookings/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ newSlot, reason }),
  });
  return parseData(body);
}

export async function completeBooking(id) {
  const body = await request(`/api/reception/bookings/${id}/complete`, {
    method: "PATCH",
  });
  return parseData(body);
}

export async function cancelBooking(id, reason) {
  const body = await request(`/api/reception/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return parseData(body);
}

export async function addBookingNote(id, note) {
  const body = await request(`/api/reception/bookings/${id}/note`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
  return parseData(body);
}

export async function deleteBooking(id) {
  await request(`/api/admin/bookings/${id}`, {
    method: "DELETE",
  });
  return true;
}

export async function getMessages() {
  const body = await request("/api/reception/messages");
  return parseData(body) || [];
}

export async function updateMessage(id, patch) {
  const body = await request(`/api/reception/messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseData(body);
}

export async function getTimeSlots(role) {
  const path = role === "admin" ? "/api/admin/time-slots" : "/api/reception/time-slots";
  const body = await request(path);
  return parseData(body) || [];
}

export async function createTimeSlot(payload, role = "admin") {
  const path = role === "admin" ? "/api/admin/time-slots" : "/api/reception/time-slots";
  const body = await request(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function patchTimeSlot(id, patch) {
  const body = await request(`/api/admin/time-slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseData(body);
}

export async function deleteTimeSlot(id) {
  await request(`/api/admin/time-slots/${id}`, {
    method: "DELETE",
  });
  return true;
}

export async function blockTimeSlot(id, reason) {
  const body = await request(`/api/reception/time-slots/${id}/block`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  return parseData(body);
}

export async function unblockTimeSlot(id) {
  const body = await request(`/api/reception/time-slots/${id}/unblock`, {
    method: "PATCH",
  });
  return parseData(body);
}

export async function getUsers() {
  const body = await request("/api/admin/users");
  return parseData(body) || [];
}

export async function getRoleCatalog() {
  return parseData(await request("/api/admin/roles")) || { roles: [], permissions: [] };
}

export async function createRole(payload) {
  return parseData(await request("/api/admin/roles", { method: "POST", body: JSON.stringify(payload) }));
}

export async function updateRole(key, payload) {
  return parseData(await request(`/api/admin/roles/${key}`, { method: "PATCH", body: JSON.stringify(payload) }));
}

export async function createUser(payload) {
  const body = await request("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function toggleUserActive(id, active) {
  const body = await request(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
  return parseData(body);
}

export async function updateUser(id, patch) {
  const body = await request(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseData(body);
}

export async function deleteUser(id) {
  await request(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
  return true;
}

export async function getServices(role = "admin") {
  const path = role === "reception" ? "/api/reception/services" : role === "call_center_agent" ? "/api/services" : "/api/admin/services";
  const body = await request(path);
  return parseData(body) || [];
}

export async function createService(payload) {
  const body = await request("/api/admin/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function patchService(id, patch) {
  const body = await request(`/api/admin/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseData(body);
}

export async function changeEmail(payload) {
  const body = await request("/api/auth/change-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function changePassword(payload) {
  const body = await request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function deleteService(id) {
  await request(`/api/admin/services/${id}`, {
    method: "DELETE",
  });
  return true;
}

export async function getTestimonials() {
  const body = await request("/api/reception/testimonials");
  return parseData(body) || [];
}

export async function createTestimonial(payload) {
  const body = await request("/api/reception/testimonials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function patchTestimonial(id, patch) {
  const body = await request(`/api/reception/testimonials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseData(body);
}

export async function deleteTestimonial(id) {
  await request(`/api/reception/testimonials/${id}`, {
    method: "DELETE",
  });
  return true;
}

export async function getEmailNotifications() {
  const body = await request("/api/admin/email-notifications");
  return parseData(body) || [];
}

export async function retryEmailNotification(id) {
  const body = await request(`/api/admin/email-notifications/${id}/retry`, {
    method: "PATCH",
  });
  return parseData(body);
}

export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const body = await request(`/api/admin/audit-logs${params.size ? `?${params}` : ""}`);
  return parseData(body) || [];
}

export async function downloadAuditLogsCsv(filters = {}) {
  const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs/export.csv?${params}`, { headers: getHeaders() });
  if (!response.ok) throw new Error("Unable to export audit logs.");
  return response.blob();
}

export async function getCallActivities(filters = {}, role = "reception") {
  const params = new URLSearchParams(filters);
  const body = await request(`/api/calls${params.size ? `?${params}` : ""}`);
  return parseData(body) || [];
}

export async function createCallActivity(payload, role = "reception") {
  return parseData(await request("/api/calls", { method: "POST", body: JSON.stringify(payload) }));
}

export async function updateCallActivity(id, patch, role = "reception") {
  return parseData(await request(`/api/calls/${id}`, { method: "PATCH", body: JSON.stringify(patch) }));
}

export async function getDailyVisits(filters = {}) {
  const params = new URLSearchParams(filters);
  return parseData(await request(`/api/reception/visits${params.size ? `?${params}` : ""}`)) || [];
}

export async function getNotifications() {
  return parseData(await request("/api/notifications")) || { notifications: [], unreadCount: 0 };
}

export async function markNotificationRead(id) {
  return parseData(await request(`/api/notifications/${id}/read`, { method: "PATCH" }));
}

export async function markAllNotificationsRead() {
  return parseData(await request("/api/notifications/read-all", { method: "PATCH" }));
}

export async function createDailyVisit(payload) {
  return parseData(await request("/api/reception/visits", { method: "POST", body: JSON.stringify(payload) }));
}

export async function getSocialPosts(filters = {}) {
  const params = new URLSearchParams(filters);
  return parseData(await request(`/api/admin/social/posts${params.size ? `?${params}` : ""}`)) || [];
}

export async function createSocialPost(payload) {
  return parseData(await request("/api/admin/social/posts", { method: "POST", body: JSON.stringify(payload) }));
}

export async function getFollowerObservations() {
  return parseData(await request("/api/admin/social/followers")) || [];
}

export async function createFollowerObservation(payload) {
  return parseData(await request("/api/admin/social/followers", { method: "POST", body: JSON.stringify(payload) }));
}

export async function previewReport(filters, role = "admin") {
  const params = new URLSearchParams(filters);
  return parseData(await request(`${role === "reception" ? "/api/reception" : "/api/admin"}/reports/preview?${params}`));
}

export async function generateReport(payload, role = "admin") {
  return parseData(await request(`${role === "reception" ? "/api/reception" : "/api/admin"}/reports/generate`, { method: "POST", body: JSON.stringify(payload) }));
}

export async function getReportHistory(role = "admin") {
  return parseData(await request(`${role === "reception" ? "/api/reception" : "/api/admin"}/reports`)) || [];
}

export async function markReportShareOpened(id, role = "admin") {
  return parseData(await request(`${role === "reception" ? "/api/reception" : "/api/admin"}/reports/${id}/share-opened`, { method: "POST" }));
}

export async function downloadReportCsv(filters, role = "admin") {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${API_BASE_URL}/api/${role === "reception" ? "reception" : "admin"}/reports/export.csv?${params}`, { headers: getHeaders() });
  if (!response.ok) throw new Error("Unable to export this report.");
  return response.blob();
}
