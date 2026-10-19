import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiEdit3, FiTrash2, FiRefreshCw, FiCheck, FiScissors } from "react-icons/fi";
import { getServices, createService, patchService, deleteService } from "../api";
import { Field, TextInput, TextArea, Select, PrimaryButton, SectionShell, IconButton, StatusPill } from "../components/ui/Controls";

const EMPTY_SERVICE_FORM = {
  name: "",
  category: "Hair",
  description: "",
  icon: "",
  active: true,
  visible: true,
  isComingSoon: false,
  estimatedDurationMinutes: "",
  maxAppointmentsPerDay: "",
  sortOrder: 0,
};

export default function Services() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_SERVICE_FORM);
  const [editingId, setEditingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getServices());
    } catch (err) {
      setError(err.message || "Unable to load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await patchService(editingId, form);
      else await createService(form);
      setForm(EMPTY_SERVICE_FORM);
      setEditingId("");
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggle = async (service, field) => {
    try {
      await patchService(service.id, { [field]: !service[field] });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (service) => {
    if (!window.confirm(`Delete ${service.name}?`)) return;
    try {
      await deleteService(service.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const edit = (service) => {
    setEditingId(service.id || service._id);
    setForm({ name: service.name || "", category: service.category || "Other Services", description: service.description || "", icon: service.icon || "", active: service.active !== false, visible: service.visible !== false, isComingSoon: Boolean(service.isComingSoon), estimatedDurationMinutes: service.estimatedDurationMinutes ?? "", maxAppointmentsPerDay: service.maxAppointmentsPerDay ?? "", sortOrder: service.sortOrder || 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <SectionShell title="Services" subtitle="Manage treatment categories, duration, visibility, and availability." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <form onSubmit={save} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></Field>
        <Field label="Category"><TextInput value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} required maxLength={80} placeholder="Hair, Skin, Body, or another category" /></Field>
        <Field label="Duration (minutes)"><TextInput type="number" min="1" value={form.estimatedDurationMinutes} onChange={(e) => setForm((prev) => ({ ...prev, estimatedDurationMinutes: e.target.value === "" ? "" : Number(e.target.value) }))} required /></Field>
        <Field label="Max per day"><TextInput type="number" min="0" value={form.maxAppointmentsPerDay} onChange={(e) => setForm((prev) => ({ ...prev, maxAppointmentsPerDay: e.target.value === "" ? "" : Number(e.target.value) }))} required /></Field>
        <Field label="Icon"><TextInput value={form.icon} onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))} /></Field>
        <Field label="Sort"><TextInput type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))} /></Field>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
          <label htmlFor="active" className="text-sm font-medium">Active</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="visible" checked={form.visible} onChange={(e) => setForm((prev) => ({ ...prev, visible: e.target.checked }))} />
          <label htmlFor="visible" className="text-sm font-medium">Visible</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isComingSoon" checked={form.isComingSoon} onChange={(e) => setForm((prev) => ({ ...prev, isComingSoon: e.target.checked }))} />
          <label htmlFor="isComingSoon" className="text-sm font-medium">Coming Soon</label>
        </div>
        <PrimaryButton icon={editingId ? FiCheck : FiPlus} className="self-end">{editingId ? "Save changes" : "Create service"}</PrimaryButton>
        {editingId ? <button type="button" className="self-end rounded-md border border-stone-200 px-3 py-2 text-sm" onClick={() => { setEditingId(""); setForm(EMPTY_SERVICE_FORM); }}>Cancel edit</button> : null}
        <Field label="Description"><TextArea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="md:col-span-3 xl:col-span-6" /></Field>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((service) => (
          <article key={service.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-champagne-700">{service.category}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-evergreen-950">{service.name}</h2>
              </div>
              <span className="rounded-md bg-stone-100 p-2 text-evergreen-900" aria-label={`${service.category} service`}><FiScissors aria-hidden="true" /></span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-500">{service.description || "No description"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill value={service.active === false ? "inactive" : "active"} />
              <StatusPill value={service.visible === false ? "hidden" : "visible"} />
              {service.isComingSoon && <StatusPill value="coming soon" />}
              <div className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700">{service.estimatedDurationMinutes} min</div>
              <div className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700">{service.maxAppointmentsPerDay} / day</div>
            </div>
            <div className="mt-4 flex gap-2">
              <IconButton title="Edit service" icon={FiEdit3} onClick={() => edit(service)} />
              <IconButton title="Toggle active" icon={FiCheck} onClick={() => toggle(service, "active")} />
              <IconButton title="Toggle visible" icon={FiEdit3} onClick={() => toggle(service, "visible")} />
              <IconButton title="Toggle coming soon" icon={FiRefreshCw} onClick={() => toggle(service, "isComingSoon")} />
              <IconButton title="Delete" icon={FiTrash2} tone="danger" onClick={() => remove(service)} />
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
