import { useCallback, useEffect, useState } from "react";
import { FiPhone, FiRefreshCw, FiCheck } from "react-icons/fi";
import { createCallActivity, getBookings, getCallActivities, getServices, getUsers, updateCallActivity } from "../api";
import { Field, TextInput, Select, TextArea, PrimaryButton, SectionShell, StatusPill, EmptyState } from "../components/ui/Controls";

const EMPTY = { direction: "inbound", phone: "", patientName: "", patientCardNumber: "", purpose: "", service: "", outcome: "consultation_inquiry", booking: "", assignedTo: "", status: "pending", followUpRequired: false, followUpAt: "", notes: "" };

export default function Calls({ role }) {
  const [form, setForm] = useState(EMPTY);
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [followUpsOnly, setFollowUpsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [activity, serviceRows, bookingRows, users] = await Promise.all([getCallActivities(followUpsOnly ? { followUp: "true" } : {}, role), getServices(role), role === "admin" ? getBookings(role) : Promise.resolve([]), role === "admin" ? getUsers() : Promise.resolve([])]);
      setRows(activity); setServices(serviceRows); setBookings(bookingRows); setAgents(users.filter((user) => user.role === "call_center_agent" && user.active !== false));
    } catch (err) { setError(err.message || "Unable to load call activity."); }
    finally { setLoading(false); }
  }, [followUpsOnly, role]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const payload = { ...form, service: form.service || undefined, booking: form.booking || undefined, assignedTo: form.assignedTo || undefined, patientName: form.patientName || undefined, patientCardNumber: form.patientCardNumber || undefined, followUpAt: form.followUpAt || undefined };
      if (editingId) await updateCallActivity(editingId, payload, role); else await createCallActivity(payload, role);
      setForm(EMPTY); setEditingId(""); setNotice(editingId ? "Call record updated." : "Manual call record saved."); await load();
    } catch (err) { setError(err.message || "Unable to save this call record."); }
  };

  const toggleFollowUp = async (row) => {
    try { await updateCallActivity(row.id || row._id, { followUpRequired: false, status: "completed" }, role); await load(); }
    catch (err) { setError(err.message || "Unable to update follow-up."); }
  };

  return <SectionShell title="Call activity" subtitle="Manually recorded inbound and outbound calls. These are not imported from a phone system." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
      {editingId ? <p className="md:col-span-2 xl:col-span-4 text-sm font-semibold text-evergreen-900">Editing a call record. Update the caller details and save.</p> : null}
      <Field label="Direction"><Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="inbound">Inbound</option><option value="outbound">Outbound</option></Select></Field>
      <Field label="Phone (optional)"><TextInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Patient name (optional)"><TextInput value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} maxLength={120} /></Field>
      <Field label="Patient card number (optional)"><TextInput value={form.patientCardNumber} onChange={(e) => setForm({ ...form, patientCardNumber: e.target.value })} maxLength={40} /></Field>
      <Field label="Purpose"><TextInput value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required maxLength={120} /></Field>
      <Field label="Outcome"><Select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}><option value="booking_created">Booking created</option><option value="consultation_inquiry">Consultation inquiry</option><option value="follow_up">Follow-up required</option><option value="information_provided">Information provided</option><option value="no_answer">No answer</option><option value="unsuccessful">Unsuccessful</option><option value="other">Other</option></Select></Field>
      <Field label="Activity status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value, followUpRequired: e.target.value === "follow_up_required" ? true : e.target.value === "completed" ? false : form.followUpRequired })}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="follow_up_required">Follow-up required</option><option value="completed">Completed</option><option value="unable_to_reach">Unable to reach</option></Select></Field>
      <Field label="Related service (optional)"><Select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}><option value="">Not specified</option>{services.map((service) => <option key={service.id || service._id} value={service.id || service._id}>{service.name}</option>)}</Select></Field>
      {role === "admin" ? <Field label="Linked appointment (optional)"><Select value={form.booking} onChange={(e) => setForm({ ...form, booking: e.target.value })}><option value="">No appointment linked</option>{bookings.map((booking) => <option key={booking.id || booking._id} value={booking.id || booking._id}>{booking.fullName} · {new Date(booking.createdAt).toLocaleDateString()}</option>)}</Select></Field> : null}
      {role === "admin" ? <Field label="Assigned Call Center Agent"><Select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Unassigned</option>{agents.map((agent) => <option key={agent.id || agent._id} value={agent.id || agent._id}>{agent.name}</option>)}</Select></Field> : null}
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={form.followUpRequired} onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked, status: e.target.checked ? "follow_up_required" : (form.status === "follow_up_required" ? "pending" : form.status) })} />Follow-up required</label>
      {form.followUpRequired ? <Field label="Follow-up date"><TextInput type="date" value={form.followUpAt} onChange={(e) => setForm({ ...form, followUpAt: e.target.value })} /></Field> : null}
      <Field label="Notes (optional)" className="md:col-span-2"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} /></Field>
      <div className="flex items-center gap-2 self-end"><PrimaryButton icon={FiPhone} type="submit">{editingId ? "Update call record" : "Save call record"}</PrimaryButton>{editingId ? <button type="button" className="min-h-10 rounded-lg border border-stone-200 px-3 text-sm" onClick={() => { setEditingId(""); setForm(EMPTY); }}>Cancel</button> : null}</div>
    </form>
    <div className="mt-5 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold text-evergreen-950">Recent calls</h2><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={followUpsOnly} onChange={(e) => setFollowUpsOnly(e.target.checked)} />Follow-ups only</label></div>
    {!loading && rows.length === 0 ? <EmptyState title="No call records" body="Calls recorded by staff will appear here." /> : null}
    <div className="mt-3 grid gap-3">{rows.map((row) => <article key={row.id || row._id} className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-evergreen-950">{row.direction === "inbound" ? "Inbound" : "Outbound"} · {row.purpose}</h3><StatusPill value={row.outcome.replaceAll("_", " ")} /><span className="text-sm text-stone-500">{new Date(row.loggedAt).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })} EAT</span></div>
      <p className="mt-2 text-sm text-stone-600">{row.patientName || row.phone || "No patient name"}{row.patientCardNumber ? ` · Card ${row.patientCardNumber}` : ""}{row.service?.name ? ` · ${row.service.name}` : ""}{row.booking ? ` · Booking for ${row.booking.fullName}` : ""}{row.assignedTo?.name ? ` · Assigned to ${row.assignedTo.name}` : ""}{row.staff?.name ? ` · Logged by ${row.staff.name}` : ""}</p>
      <p className="mt-1 text-xs text-stone-500">Status: {String(row.status || (row.followUpRequired ? "follow_up_required" : "pending")).replaceAll("_", " ")}</p>
      {row.notes ? <p className="mt-2 text-sm text-stone-500">{row.notes}</p> : null}
      <button type="button" className="mt-3 rounded border border-stone-200 px-3 py-2 text-sm text-evergreen-950" onClick={() => { setEditingId(row.id || row._id); setForm({ direction: row.direction, phone: row.phone || "", patientName: row.patientName || row.patient?.fullName || "", patientCardNumber: row.patientCardNumber || row.patient?.cardNumber || "", purpose: row.purpose || "", service: row.service?._id || row.service?.id || "", outcome: row.outcome, booking: row.booking?._id || row.booking?.id || "", assignedTo: row.assignedTo?._id || row.assignedTo?.id || "", status: row.status || "pending", followUpRequired: Boolean(row.followUpRequired), followUpAt: row.followUpAt ? new Date(row.followUpAt).toISOString().slice(0, 10) : "", notes: row.notes || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit caller details</button>
      {row.followUpRequired || row.status === "follow_up_required" ? <button type="button" className="mt-3 inline-flex items-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm text-evergreen-950" onClick={() => toggleFollowUp(row)}><FiCheck />Mark follow-up completed</button> : null}
    </article>)}</div>
  </SectionShell>;
}
