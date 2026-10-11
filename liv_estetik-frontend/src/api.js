// Default to empty so relative `/api` requests go through Vite proxy in dev.
const API_BASE = (import.meta.env.VITE_API_BASE_URL) ?? "";

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
  if (!res.ok) {
    const err = new Error(body?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function getServices() {
  const res = await request(`/api/services`);
  return res?.data || [];
}

export async function getTestimonials() {
  const res = await request(`/api/testimonials`);
  return res?.data || [];
}

export async function getTimeSlots(from, to, serviceIds) {
  const qs = [];
  if (from) qs.push(`from=${encodeURIComponent(from)}`);
  if (to) qs.push(`to=${encodeURIComponent(to)}`);
  if (serviceIds && serviceIds.length > 0) {
    qs.push(`serviceIds=${encodeURIComponent(serviceIds.join(","))}`);
  }
  const q = qs.length ? `?${qs.join("&")}` : "";
  const res = await request(`/api/time-slots${q}`);
  return res?.data || [];
}

export async function postBooking(data) {
  return request(`/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function postMessage(data) {
  return request(`/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export default { getServices, getTestimonials, postBooking, postMessage };
