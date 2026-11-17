import { useCallback, useEffect, useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiSave, FiUserPlus, FiX } from "react-icons/fi";
import { createPatient, createPrpCourse, getPatient, getPatients, updatePatient, updatePrpSession } from "../api";
import { EmptyState, Field, PrimaryButton, SectionShell, Select, TextArea, TextInput } from "../components/ui/Controls";

const blankPatient = () => ({ fullName: "", phone: "", email: "", age: "", sex: "", address: "", notes: "" });
const dateInput = (value) => value ? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date(value)) : "";

export default function Patients() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [newPatient, setNewPatient] = useState(blankPatient());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await getPatients(query)); }
    catch (err) { setError(err.message || "Unable to load patients."); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { loadRows(); }, [loadRows]);

  const openProfile = async (id) => {
    setSelectedId(id); setError(""); setNotice(""); setEditing(false);
    try { setProfile(await getPatient(id)); }
    catch (err) { setProfile(null); setError(err.message || "Unable to load patient record."); }
  };
  const register = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const created = await createPatient({ ...newPatient, age: newPatient.age ? Number(newPatient.age) : undefined, email: newPatient.email || undefined, phone: newPatient.phone || undefined });
      setNewPatient(blankPatient()); setCreating(false); await loadRows(); await openProfile(created._id || created.id); setNotice(`Patient registered with card ${created.cardNumber}.`);
    } catch (err) { setError(err.message || "Unable to register patient."); }
    finally { setSaving(false); }
  };
  const beginEdit = () => { setDraft({ ...profile.patient }); setEditing(true); setError(""); setNotice(""); };
  const cancelEdit = () => { setDraft(null); setEditing(false); };
  const saveEdit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try { await updatePatient(selectedId, { ...draft, age: draft.age === "" ? null : Number(draft.age), email: draft.email || "", phone: draft.phone || "" }); setEditing(false); await openProfile(selectedId); await loadRows(); setNotice("Patient record updated."); }
    catch (err) { setError(err.message || "Unable to update patient record."); }
    finally { setSaving(false); }
  };
  const addCourse = async () => {
    setSaving(true); setError(""); setNotice("");
    try { await createPrpCourse(selectedId); await openProfile(selectedId); setNotice("A six-session PRP course was added."); }
    catch (err) { setError(err.message || "Unable to add PRP course."); }
    finally { setSaving(false); }
  };
  const saveSession = async (course, sessionNumber, patch) => {
    setError(""); setNotice("");
    try {
      const value = await updatePrpSession(selectedId, course._id || course.id, sessionNumber, patch);
      setProfile((current) => ({ ...current, prpCourses: current.prpCourses.map((row) => String(row._id || row.id) === String(value._id || value.id) ? value : row) }));
      setNotice(`PRP session ${sessionNumber} saved.`);
    } catch (err) { setError(err.message || "Unable to save this PRP session."); }
  };
  const patient = profile?.patient;

  return <SectionShell title="Patients" subtitle="Find patient records by name, contact details, or card number. Patient edits and PRP session changes are recorded." action={<div className="flex flex-wrap gap-2"><PrimaryButton icon={FiPlus} onClick={() => { setCreating((value) => !value); setProfile(null); setSelectedId(""); setError(""); }}>{creating ? "Close registration" : "Register patient"}</PrimaryButton><PrimaryButton icon={FiRefreshCw} onClick={loadRows}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton></div>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    {creating ? <form onSubmit={register} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="Full name"><TextInput value={newPatient.fullName} onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })} required minLength={2} maxLength={120} /></Field>
      <Field label="Phone"><TextInput type="tel" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} maxLength={40} /></Field>
      <Field label="Email"><TextInput type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} maxLength={254} /></Field>
      <Field label="Age"><TextInput type="number" min="1" max="120" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} /></Field>
      <Field label="Sex"><Select value={newPatient.sex} onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value })}><option value="">Not specified</option><option>Female</option><option>Male</option><option>Other</option></Select></Field>
      <Field label="Address"><TextInput value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} maxLength={300} /></Field>
      <Field label="Notes" className="md:col-span-2"><TextArea rows={2} value={newPatient.notes} onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })} maxLength={2000} /></Field>
      <div className="self-end"><PrimaryButton type="submit" icon={FiUserPlus} disabled={saving}>{saving ? "Saving…" : "Register patient"}</PrimaryButton></div>
    </form> : null}

    <div className="grid gap-4 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.6fr)]">
      <section className="grid content-start gap-3 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="font-display text-xl font-semibold text-evergreen-950">Patient records</h2>
        <TextInput aria-label="Search patient records" placeholder="Name, phone, email, or card number" value={query} onChange={(e) => setQuery(e.target.value)} />
        {rows.length === 0 && !loading ? <EmptyState title="No patients found" body={query ? "Try another name, phone number, email, or card number." : "New patient records will appear here."} /> : null}
        <div className="grid gap-2">{rows.map((row) => <button type="button" key={row._id || row.id} onClick={() => openProfile(row._id || row.id)} className={`rounded-md border p-3 text-left transition ${selectedId === (row._id || row.id) ? "border-evergreen-800 bg-evergreen-50" : "border-stone-200 hover:border-evergreen-700"}`}><span className="block font-semibold text-evergreen-950">{row.fullName}</span><span className="mt-1 block text-xs text-champagne-800">{row.cardNumber || "Card pending"}</span><span className="mt-1 block text-sm text-stone-500">{row.phone || row.email || "No contact details"}</span></button>)}</div>
      </section>

      {!patient ? <EmptyState title="Select a patient" body="Open a patient record to review details, update contact information, or track PRP treatments." /> : <section className="grid content-start gap-4">
        <article className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold text-evergreen-950">{patient.fullName}</h2><p className="mt-1 text-sm font-semibold text-champagne-800">Patient card: {patient.cardNumber || "Not assigned"}</p><p className="mt-1 text-xs text-stone-500">Registered {new Date(patient.createdAt).toLocaleDateString("en-GB", { timeZone: "Africa/Addis_Ababa" })}</p></div>{!editing ? <PrimaryButton icon={FiEdit3} onClick={beginEdit}>Edit record</PrimaryButton> : null}</div>
          {editing ? <form onSubmit={saveEdit} className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Full name"><TextInput value={draft.fullName || ""} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} required minLength={2} maxLength={120} /></Field><Field label="Phone"><TextInput type="tel" value={draft.phone || ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} maxLength={40} /></Field>
            <Field label="Email"><TextInput type="email" value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} maxLength={254} /></Field><Field label="Age"><TextInput type="number" min="1" max="120" value={draft.age ?? ""} onChange={(e) => setDraft({ ...draft, age: e.target.value })} /></Field>
            <Field label="Sex"><Select value={draft.sex || ""} onChange={(e) => setDraft({ ...draft, sex: e.target.value })}><option value="">Not specified</option><option>Female</option><option>Male</option><option>Other</option></Select></Field><Field label="Address"><TextInput value={draft.address || ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} maxLength={300} /></Field>
            <Field label="Notes" className="md:col-span-2"><TextArea value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} maxLength={2000} /></Field><div className="flex gap-2 md:col-span-2"><PrimaryButton type="submit" icon={FiSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</PrimaryButton><button type="button" onClick={cancelEdit} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm" disabled={saving}><FiX />Cancel</button></div>
          </form> : <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-2"><p>Phone: {patient.phone || "Not recorded"}</p><p>Email: {patient.email || "Not recorded"}</p><p>Age: {patient.age || "Not recorded"}</p><p>Sex: {patient.sex || "Not recorded"}</p><p className="sm:col-span-2">Address: {patient.address || "Not recorded"}</p>{patient.notes ? <p className="sm:col-span-2">Notes: {patient.notes}</p> : null}</div>}
        </article>

        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-display text-xl font-semibold text-evergreen-950">PRP treatment courses</h3><p className="text-sm text-stone-500">Each course has six sessions. A date does not mark a session complete.</p></div><PrimaryButton icon={FiPlus} onClick={addCourse} disabled={saving}>Add course</PrimaryButton></div>
          {!profile.prpCourses?.length ? <p className="mt-4 rounded-md bg-stone-50 p-4 text-sm text-stone-500">No PRP courses recorded for this patient.</p> : null}
          <div className="mt-4 grid gap-4">{profile.prpCourses?.map((course) => { const completed = course.sessions.filter((session) => session.completed).length; return <article key={course._id || course.id} className="overflow-hidden rounded-md border border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 px-3 py-2"><h4 className="font-semibold text-evergreen-950">{course.title || `PRP course ${course.courseNumber}`}</h4><span className="text-sm text-stone-600">{completed} of 6 completed</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[36rem] text-left text-sm"><thead><tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-500"><th className="px-3 py-2">Session</th><th className="px-3 py-2">Treatment date</th><th className="px-3 py-2">Completed</th><th className="px-3 py-2">Updated by</th></tr></thead><tbody>{course.sessions.slice().sort((a, b) => a.sessionNumber - b.sessionNumber).map((session) => <tr key={session.sessionNumber} className="border-b border-stone-100 last:border-0"><td className="px-3 py-2 font-medium text-evergreen-950">PRP Session {session.sessionNumber}</td><td className="px-3 py-2"><TextInput aria-label={`Session ${session.sessionNumber} date`} type="date" value={dateInput(session.treatmentDate)} onChange={(e) => saveSession(course, session.sessionNumber, { treatmentDate: e.target.value ? new Date(`${e.target.value}T00:00:00+03:00`).toISOString() : null })} /></td><td className="px-3 py-2"><input aria-label={`Mark session ${session.sessionNumber} completed`} type="checkbox" checked={Boolean(session.completed)} onChange={(e) => saveSession(course, session.sessionNumber, { completed: e.target.checked })} className="h-4 w-4 accent-emerald-800" /></td><td className="px-3 py-2 text-xs text-stone-500">{session.updatedBy?.name || session.createdBy?.name || "Staff"}{session.updatedAt ? ` · ${new Date(session.updatedAt).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })}` : ""}</td></tr>)}</tbody></table></div>
            {course.history?.length ? <details className="border-t border-stone-100 px-3 py-2"><summary className="cursor-pointer text-xs font-medium text-stone-500">Session change history ({course.history.length})</summary><ul className="mt-2 grid gap-1 text-xs text-stone-500">{course.history.slice().reverse().map((entry, index) => <li key={`${entry.sessionNumber}-${entry.changedAt}-${index}`}>Session {entry.sessionNumber} updated by {entry.changedBy?.name || "staff"} · {new Date(entry.changedAt).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })}</li>)}</ul></details> : null}
          </article>; })}</div>
        </section>
      </section>}
    </div>
  </SectionShell>;
}
