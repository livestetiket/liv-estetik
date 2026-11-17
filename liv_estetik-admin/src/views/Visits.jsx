import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiUserPlus } from "react-icons/fi";
import { createDailyVisit, getDailyVisits, getServices } from "../api";
import { EmptyState, Field, PrimaryButton, SectionShell, Select, TextArea, TextInput } from "../components/ui/Controls";

const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
const blank = () => ({ visitDate: localToday(), cardNumber: "", fullName: "", phone: "", service: "", serviceName: "", notes: "" });

export default function Visits({ role }) {
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [visits, serviceRows] = await Promise.all([getDailyVisits(), getServices(role)]); setRows(visits); setServices(serviceRows); }
    catch (err) { setError(err.message || "Unable to load visit records."); }
    finally { setLoading(false); }
  }, [role]);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    const chosen = services.find((item) => String(item._id || item.id) === form.service);
    try {
      await createDailyVisit({ ...form, service: chosen ? form.service : undefined, visitDate: new Date(`${form.visitDate}T00:00:00+03:00`).toISOString(), serviceName: chosen?.name || form.serviceName });
      setForm(blank()); setNotice("Visitor details saved."); await load();
    } catch (err) { setError(err.message || "Unable to save this visitor."); }
  };

  return <SectionShell title="Daily visits" subtitle="Record visitors who came to the clinic, with their card, contact, and treatment details." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Visit date"><TextInput type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} required /></Field>
      <Field label="Card number"><TextInput value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} maxLength={40} /></Field>
      <Field label="Full name"><TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required minLength={2} maxLength={120} /></Field>
      <Field label="Phone number"><TextInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required minLength={7} maxLength={30} /></Field>
      <Field label="Service"><Select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value, serviceName: e.target.value === "other" ? form.serviceName : "" })} required><option value="">Choose service</option>{services.map((service) => <option key={service._id || service.id} value={service._id || service.id}>{service.name}</option>)}<option value="other">Other</option></Select></Field>
      {form.service === "other" ? <Field label="Service name"><TextInput value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} required minLength={2} maxLength={120} /></Field> : null}
      <Field label="Notes (optional)" className="md:col-span-2"><TextArea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} /></Field>
      <div className="self-end"><PrimaryButton icon={FiUserPlus} type="submit">Save visitor</PrimaryButton></div>
    </form>
    <h2 className="mt-5 font-display text-xl font-semibold text-evergreen-950">Recent visitors</h2>
    {!loading && rows.length === 0 ? <EmptyState title="No visit records" body="Visitors entered by reception will appear here." /> : null}
    <div className="grid gap-3">{rows.map((row) => <article key={row._id || row.id} className="rounded-lg border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-evergreen-950">{row.fullName}</h3><span className="text-sm text-stone-500">{new Date(row.visitDate).toLocaleDateString("en-GB", { timeZone: "Africa/Addis_Ababa" })}</span></div><p className="mt-2 text-sm text-stone-600">{row.cardNumber ? `Card ${row.cardNumber} · ` : ""}{row.phone} · {row.service?.name || row.serviceName}{row.recordedBy?.name ? ` · Logged by ${row.recordedBy.name}` : ""}</p>{row.notes ? <p className="mt-2 text-sm text-stone-500">{row.notes}</p> : null}</article>)}</div>
  </SectionShell>;
}
