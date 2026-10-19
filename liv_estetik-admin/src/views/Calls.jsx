import { useCallback, useEffect, useState } from "react";
import { FiPhone, FiRefreshCw, FiCheck } from "react-icons/fi";
import { createCallActivity, getBookings, getCallActivities, getServices, updateCallActivity } from "../api";
import { Field, TextInput, Select, TextArea, PrimaryButton, SectionShell, StatusPill, EmptyState } from "../components/ui/Controls";

const EMPTY = { direction: "inbound", phone: "", purpose: "", service: "", outcome: "consultation_inquiry", booking: "", followUpRequired: false, followUpAt: "", notes: "" };

export default function Calls({ role }) {
  const [form, setForm] = useState(EMPTY);
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [followUpsOnly, setFollowUpsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [activity, serviceRows, bookingRows] = await Promise.all([getCallActivities(followUpsOnly ? { followUp: "true" } : {}), getServices(), getBookings(role)]);
      setRows(activity); setServices(serviceRows); setBookings(bookingRows);
    } catch (err) { setError(err.message || "Unable to load call activity."); }
    finally { setLoading(false); }
  }, [followUpsOnly, role]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    try {
      await createCallActivity({ ...form, service: form.service || undefined, booking: form.booking || undefined, followUpAt: form.followUpAt || undefined });
      setForm(EMPTY); setNotice("Manual call record saved."); await load();
    } catch (err) { setError(err.message || "Unable to save this call record."); }
  };

  const toggleFollowUp = async (row) => {
    try { await updateCallActivity(row.id || row._id, { followUpRequired: !row.followUpRequired }); await load(); }
    catch (err) { setError(err.message || "Unable to update follow-up."); }
  };

  return <SectionShell title="Call activity" subtitle="Manually recorded inbound and outbound calls. These are not imported from a phone system." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Direction"><Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}><option value="inbound">Inbound</option><option value="outbound">Outbound</option></Select></Field>
      <Field label="Phone (optional)"><TextInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="Purpose"><TextInput value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required maxLength={120} /></Field>
      <Field label="Outcome"><Select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}><option value="booking_created">Booking created</option><option value="consultation_inquiry">Consultation inquiry</option><option value="follow_up">Follow-up required</option><option value="information_provided">Information provided</option><option value="no_answer">No answer</option><option value="unsuccessful">Unsuccessful</option><option value="other">Other</option></Select></Field>
      <Field label="Related service (optional)"><Select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}><option value="">Not specified</option>{services.map((service) => <option key={service.id || service._id} value={service.id || service._id}>{service.name}</option>)}</Select></Field>
      <Field label="Linked appointment (optional)"><Select value={form.booking} onChange={(e) => setForm({ ...form, booking: e.target.value })}><option value="">No appointment linked</option>{bookings.map((booking) => <option key={booking.id || booking._id} value={booking.id || booking._id}>{booking.fullName} · {new Date(booking.createdAt).toLocaleDateString()}</option>)}</Select></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={form.followUpRequired} onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })} />Follow-up required</label>
      {form.followUpRequired ? <Field label="Follow-up date"><TextInput type="date" value={form.followUpAt} onChange={(e) => setForm({ ...form, followUpAt: e.target.value })} /></Field> : null}
      <Field label="Notes (optional)" className="md:col-span-2"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={2000} /></Field>
      <div className="self-end"><PrimaryButton icon={FiPhone} type="submit">Save call record</PrimaryButton></div>
    </form>
    <div className="mt-5 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold text-evergreen-950">Recent calls</h2><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={followUpsOnly} onChange={(e) => setFollowUpsOnly(e.target.checked)} />Follow-ups only</label></div>
    {!loading && rows.length === 0 ? <EmptyState title="No call records" body="Calls recorded by staff will appear here." /> : null}
    <div className="mt-3 grid gap-3">{rows.map((row) => <article key={row.id || row._id} className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-evergreen-950">{row.direction === "inbound" ? "Inbound" : "Outbound"} · {row.purpose}</h3><StatusPill value={row.outcome.replaceAll("_", " ")} /><span className="text-sm text-stone-500">{new Date(row.loggedAt).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })} EAT</span></div>
      <p className="mt-2 text-sm text-stone-600">{row.phone || "No number"}{row.service?.name ? ` · ${row.service.name}` : ""}{row.booking ? ` · Booking for ${row.booking.fullName}` : ""}{row.staff?.name ? ` · Logged by ${row.staff.name}` : ""}</p>
      {row.notes ? <p className="mt-2 text-sm text-stone-500">{row.notes}</p> : null}
      {row.followUpRequired ? <button type="button" className="mt-3 inline-flex items-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm text-evergreen-950" onClick={() => toggleFollowUp(row)}><FiCheck />Mark follow-up handled</button> : null}
    </article>)}</div>
  </SectionShell>;
}
