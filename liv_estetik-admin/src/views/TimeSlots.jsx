import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiEdit3, FiPlus, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";
import {
  getTimeSlots,
  createTimeSlot,
  patchTimeSlot,
  deleteTimeSlot,
  blockTimeSlot,
  unblockTimeSlot,
  getServices,
} from "../api";
import { Field, TextInput, Select, PrimaryButton, SectionShell, EmptyState, IconButton, getSlotLabel, StatusPill } from "../components/ui/Controls";

const EMPTY_SLOT_FORM = { startsAt: "", endsAt: "", service: "", capacity: 1, status: "available", blockedReason: "" };

export default function TimeSlots({ role }) {
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_SLOT_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getTimeSlots(role));
      if (role === "admin") {
        const svc = await getServices();
        setServices(svc || []);
      }
    } catch (err) {
      setError(err.message || "Unable to load time slots.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const createSlot = async (event) => {
    event.preventDefault();
    try {
      await createTimeSlot(form, role);
      setForm(EMPTY_SLOT_FORM);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const slotAction = async (slot, action) => {
    const id = slot.id;
    if (!id) return;

    try {
      if (action === "block") {
        const reason = window.prompt("Block reason", slot.blockedReason || "");
        if (!reason) return;
        await blockTimeSlot(id, reason);
      }
      if (action === "unblock") {
        await unblockTimeSlot(id);
      }
      if (action === "edit") {
        const status = window.prompt("Status", slot.status || "available");
        if (!status) return;
        await patchTimeSlot(id, { status });
      }
      if (action === "delete") {
        await deleteTimeSlot(id);
      }
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionShell title="Time Slots" subtitle="Keep availability accurate for booking requests and daily scheduling." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {(role === "admin" || role === "reception") ? (
        <form onSubmit={createSlot} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-5">
          <Field label="Service">
            <Select value={form.service} onChange={(e) => setForm((prev) => ({ ...prev, service: e.target.value }))} required>
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Starts At"><TextInput type="datetime-local" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} required /></Field>
          <Field label="Ends At"><TextInput type="datetime-local" value={form.endsAt} onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))} required /></Field>
          <Field label="Capacity"><TextInput type="number" min="1" value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><option>available</option><option>unavailable</option><option>reserved</option><option>blocked</option></Select></Field>
          <PrimaryButton icon={FiPlus} className="self-end">Create slot</PrimaryButton>
        </form>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((slot) => (
          <article key={slot.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-evergreen-950">{getSlotLabel(slot)}</h2>
                <p className="mt-1 text-sm text-stone-500">{slot.service?.name ? `${slot.service.name} • ` : ''}Capacity {slot.capacity || 1}</p>
              </div>
              <StatusPill value={slot.status} />
            </div>
            {slot.blockedReason ? <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{slot.blockedReason}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(role === "reception" || role === "admin") ? <IconButton title="Block" icon={FiX} tone="danger" onClick={() => slotAction(slot, "block")} /> : null}
              {(role === "reception" || role === "admin") ? <IconButton title="Unblock" icon={FiCheck} tone="good" onClick={() => slotAction(slot, "unblock")} /> : null}
              {role === "admin" ? <IconButton title="Edit status" icon={FiEdit3} onClick={() => slotAction(slot, "edit")} /> : null}
              {role === "admin" ? <IconButton title="Delete" icon={FiTrash2} tone="danger" onClick={() => slotAction(slot, "delete")} /> : null}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
