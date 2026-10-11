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

export async function getBookings(role) {
  const path = role === "admin" ? "/api/admin/bookings" : "/api/reception/bookings";
  const body = await request(path);
  return parseData(body) || [];
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

export async function cancelBooking(id, reason = "") {
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

export async function getServices() {
  const body = await request("/api/admin/services");
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
  const body = await request("/api/admin/testimonials");
  return parseData(body) || [];
}

export async function createTestimonial(payload) {
  const body = await request("/api/admin/testimonials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return parseData(body);
}

export async function patchTestimonial(id, patch) {
  const body = await request(`/api/admin/testimonials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return parseData(body);
}

export async function deleteTestimonial(id) {
  await request(`/api/admin/testimonials/${id}`, {
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

export async function getAuditLogs() {
  const body = await request("/api/admin/audit-logs");
  return parseData(body) || [];
}
