import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiCalendar, FiEdit3, FiEye, FiTrash2, FiX, FiRefreshCw, FiPlus, FiUserCheck, FiPlay } from "react-icons/fi";
import {
  getBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  rescheduleBooking,
  completeBooking,
  cancelBooking,
  addBookingNote,
  deleteBooking,
  getBookableServices,
  getAvailableSlots,
  createReceptionBooking,
  lookupPatient,
  updateBookingStatus,
} from "../api";
import { PrimaryButton, SectionShell, IconButton, StatusPill, EmptyState, getServicesLabel, getSlotLabel, Field, TextInput, Select, TextArea } from "../components/ui/Controls";

export default function Bookings({ role }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [newBooking, setNewBooking] = useState({ fullName: "", phone: "", email: "", service: "", requestedSlot: "", source: "phone", notes: "" });
  const [duplicatePatient, setDuplicatePatient] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [agendaMode, setAgendaMode] = useState("all");
  const [agendaDate, setAgendaDate] = useState(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date()));

  useEffect(() => { getBookableServices().then((items) => setServices(items.filter((item) => item.active && !item.isComingSoon))).catch(() => {}); }, []);

  useEffect(() => {
    if (!newBooking.service) { setSlots([]); return; }
    const from = new Date(); const to = new Date(from.getTime() + 30 * 86400000);
    getAvailableSlots(from.toISOString(), to.toISOString(), newBooking.service).then(setSlots).catch((err) => setError(err.message || "Unable to load appointment times."));
  }, [newBooking.service]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getBookings(role));
    } catch (err) {
      setError(err.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetails = async (booking) => {
    const id = booking?.id || booking?._id;
    if (!id) return;
    setDetailsLoading(true);
    try {
      const data = await getBooking(role, id);
      setSelectedBooking(data.booking ?? data);
    } catch (err) {
      alert(err.message || "Unable to load booking details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => setSelectedBooking(null);

  const visibleRows = useMemo(() => rows.filter((booking) => {
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    const haystack = `${booking.fullName || ""} ${booking.email || ""} ${booking.phone || ""} ${booking.serviceName || booking.service?.name || ""}`.toLowerCase();
    const matchesService = !serviceFilter || String(booking.service?.id || booking.service?._id || booking.service) === serviceFilter;
    const matchesSource = !sourceFilter || (booking.source || "unknown") === sourceFilter;
    const startsAt = booking.approvedStartsAt || booking.requestedStartsAt || booking.approvedSlot?.startsAt || booking.requestedSlot?.startsAt;
    let matchesAgenda = true;
    if (agendaMode !== "all" && startsAt) {
      const selected = new Date(`${agendaDate}T00:00:00+03:00`);
      let rangeStart = selected;
      if (agendaMode === "week") {
        const selectedParts = new Date(`${agendaDate}T00:00:00Z`);
        rangeStart = new Date(selected.getTime() - (((selectedParts.getUTCDay() + 6) % 7) * 86400000));
      }
      const rangeEnd = new Date(rangeStart.getTime() + (agendaMode === "week" ? 7 : 1) * 86400000);
      const appointmentDate = new Date(startsAt);
      matchesAgenda = appointmentDate >= rangeStart && appointmentDate < rangeEnd;
    } else if (agendaMode !== "all") matchesAgenda = false;
    return matchesStatus && matchesService && matchesSource && matchesAgenda && haystack.includes(query.trim().toLowerCase());
  }).sort((a, b) => {
    if (agendaMode === "all") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    const aDate = new Date(a.approvedStartsAt || a.requestedStartsAt || 0);
    const bDate = new Date(b.approvedStartsAt || b.requestedStartsAt || 0);
    return aDate - bDate;
  }), [rows, query, statusFilter, serviceFilter, sourceFilter, agendaMode, agendaDate]);

  const saveNewBooking = async (event) => {
    event.preventDefault(); setError("");
    try {
      await createReceptionBooking({ ...newBooking, email: newBooking.email || undefined, notes: newBooking.notes || undefined });
      setNewBooking({ fullName: "", phone: "", email: "", service: "", requestedSlot: "", source: "phone", notes: "" });
      setDuplicatePatient(null); setShowCreate(false); await load();
    } catch (err) { setError(err.message || "Unable to create booking."); }
  };

  const checkDuplicatePatient = async () => {
    if (newBooking.phone.trim().length < 7) return;
    try { setDuplicatePatient(await lookupPatient(newBooking.phone)); }
    catch { setDuplicatePatient(null); }
  };

  const setAppointmentStatus = async (booking, status) => {
    const id = booking.id || booking._id;
    setBusyId(`${id}:${status}`);
    try { await updateBookingStatus(id, status); await load(); }
    catch (err) { setError(err.message || "Unable to update appointment."); }
    finally { setBusyId(""); }
  };

  const act = async (booking, action) => {
    const id = booking.id || booking._id;
    if (!id) return;

    setBusyId(`${id}:${action}`);
    try {
      if (action === "reject") {
        const reason = window.prompt("Reason for rejection", booking.notes || "");
        if (!reason) return;
        await rejectBooking(role, id, reason);
      }
      if (action === "reschedule") {
        const newSlot = window.prompt("New slot ID", booking.requestedSlot?.id || booking.requestedSlot?._id || "");
        if (!newSlot) return;
        const reason = window.prompt("Reason for reschedule", booking.notes || "");
        if (!reason) return;
        await rescheduleBooking(role, id, newSlot, reason);
      }
      if (action === "approve") {
        await approveBooking(role, id, booking.notes || "");
      }
      if (action === "complete") {
        await completeBooking(id);
      }
      if (action === "cancel") {
        const reason = window.prompt("Reason for cancellation", booking.notes || "");
        if (!reason || reason.trim().length < 2) return;
        await cancelBooking(id, reason.trim());
      }
      if (action === "note") {
        const note = window.prompt("Internal note", booking.notes || "");
        if (!note) return;
        await addBookingNote(id, note);
      }
      if (action === "delete") {
        await deleteBooking(id);
      }
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <SectionShell title="Bookings" subtitle="Create and manage appointments, with each change recorded in the booking history." action={<div className="flex gap-2"><PrimaryButton icon={FiPlus} onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Close form" : "New booking"}</PrimaryButton><PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton></div>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {showCreate ? <form onSubmit={saveNewBooking} className="mb-4 grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Patient name"><TextInput value={newBooking.fullName} onChange={(e) => setNewBooking({ ...newBooking, fullName: e.target.value })} required minLength={2} /></Field>
        <Field label="Phone"><TextInput type="tel" value={newBooking.phone} onBlur={checkDuplicatePatient} onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })} required minLength={7} /></Field>
        <Field label="Email (optional)"><TextInput type="email" value={newBooking.email} onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })} /></Field>
        <Field label="Booking source"><Select value={newBooking.source} onChange={(e) => setNewBooking({ ...newBooking, source: e.target.value })}><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="walk_in">Walk-in</option><option value="referral">Referral</option><option value="other">Other</option></Select></Field>
        <Field label="Service"><Select value={newBooking.service} onChange={(e) => setNewBooking({ ...newBooking, service: e.target.value, requestedSlot: "" })} required><option value="">Choose a service</option>{services.map((service) => <option key={service.id || service._id} value={service.id || service._id}>{service.name} · {service.category}</option>)}</Select></Field>
        <Field label="Available appointment time"><Select value={newBooking.requestedSlot} onChange={(e) => setNewBooking({ ...newBooking, requestedSlot: e.target.value })} required disabled={!newBooking.service}><option value="">Choose a time</option>{slots.map((slot) => <option key={slot.id || slot._id} value={slot.id || slot._id}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }).format(new Date(slot.startsAt))} EAT</option>)}</Select></Field>
        <Field label="Booking notes (optional)" className="md:col-span-2"><TextArea rows={2} value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} maxLength={2000} /></Field>
        {duplicatePatient ? <p className="rounded bg-amber-50 p-3 text-sm text-amber-900 md:col-span-2 xl:col-span-4">Existing patient found: <strong>{duplicatePatient.fullName}</strong>{duplicatePatient.email ? ` · ${duplicatePatient.email}` : ""}. Saving with this phone will link the booking to that patient record.</p> : null}
        <div className="self-end"><PrimaryButton type="submit" icon={FiPlus}>Create appointment request</PrimaryButton></div>
      </form> : null}
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_12rem]"><TextInput aria-label="Search patients and services" placeholder="Search patient, phone, email, service…" value={query} onChange={(e) => setQuery(e.target.value)} /><Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option>{["pending", "approved", "arrived", "in_progress", "rescheduled", "completed", "cancelled", "no_show", "rejected"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</Select></div>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><Select aria-label="Agenda view" value={agendaMode} onChange={(e) => setAgendaMode(e.target.value)}><option value="all">All appointment requests</option><option value="day">Daily agenda</option><option value="week">Weekly agenda</option></Select>{agendaMode !== "all" ? <TextInput aria-label="Agenda date" type="date" value={agendaDate} onChange={(e) => setAgendaDate(e.target.value)} /> : null}<Select aria-label="Filter by service" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}><option value="">All services</option>{[...new Map(rows.map((row) => [String(row.service?.id || row.service?._id || row.service), row.service?.name || row.serviceName]).filter(([id, name]) => id && name)).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select><Select aria-label="Filter by booking source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="">All booking sources</option>{["website", "phone", "whatsapp", "tiktok", "instagram", "facebook", "walk_in", "referral", "other", "unknown"].map((source) => <option key={source} value={source}>{source.replaceAll("_", " ")}</option>)}</Select></div>
      {detailsLoading && !selectedBooking ? <p className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-evergreen-950">Loading booking details…</p> : null}
      {selectedBooking ? (
        <article className="mb-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-evergreen-950">Booking details</h2>
              <p className="text-sm text-stone-500">{selectedBooking.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-evergreen-950 transition hover:bg-stone-50" onClick={closeDetails}>
                Close
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Client</p>
              <p className="mt-2 font-semibold text-evergreen-950">{selectedBooking.fullName || selectedBooking.name || "Unnamed client"}</p>
              <p className="text-sm text-stone-600">{selectedBooking.email || "No email"}</p>
              <p className="text-sm text-stone-600">{selectedBooking.phone || "No phone"}</p>
              {selectedBooking.age && <p className="text-sm text-stone-600">Age: {selectedBooking.age}</p>}
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Appointment</p>
              <p className="mt-2 font-semibold text-evergreen-950">{getSlotLabel(selectedBooking.requestedSlot)}</p>
              <p className="text-sm text-stone-600">{getServicesLabel(selectedBooking.service || selectedBooking.services)}</p>
              <p className="mt-2 text-sm text-stone-500">Status: {selectedBooking.status}</p>
            </div>
          </div>
          {selectedBooking.notes ? <p className="mt-4 rounded-md bg-stone-50 p-4 text-sm text-stone-600">{selectedBooking.notes}</p> : null}
        </article>
      ) : null}
      {visibleRows.length === 0 && !loading ? <EmptyState title={rows.length ? "No matching bookings" : "No bookings yet"} body={rows.length ? "Change the search or status filter." : "Website and staff bookings will appear here."} /> : null}
      <div className="grid gap-3">
        {visibleRows.map((booking) => (
          <article key={booking.id || booking._id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-semibold text-evergreen-950">{booking.fullName || booking.name || "Unnamed client"}</h2>
                  <StatusPill value={booking.status} />
                </div>
              <div className="mt-3 grid gap-2 text-sm text-stone-600 md:grid-cols-2 xl:grid-cols-5">
                  <span>{booking.fullName || "Unnamed"}</span>
                  {booking.age && <span>Age: {booking.age}</span>}
                  <span>{booking.email || "No email"}</span>
                  <span>{booking.phone || "No phone"}</span>
                  <span>{getServicesLabel(booking.service || booking.services)}</span>
                </div>
                {booking.notes ? <p className="mt-3 rounded-md bg-stone-50 p-3 text-sm leading-6 text-stone-500">{booking.notes}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <IconButton title="View details" icon={FiEye} onClick={() => openDetails(booking)} />
                {["pending", "reschedule_requested"].includes(booking.status) ? <IconButton title="Confirm appointment" icon={FiCheck} tone="good" disabled={busyId === `${booking.id || booking._id}:approve`} onClick={() => act(booking, "approve")} /> : null}
                {["pending", "reschedule_requested"].includes(booking.status) ? <IconButton title="Reject request" icon={FiX} tone="danger" disabled={busyId === `${booking.id || booking._id}:reject`} onClick={() => act(booking, "reject")} /> : null}
                {["pending", "approved", "reschedule_requested", "rescheduled"].includes(booking.status) ? <IconButton title="Reschedule" icon={FiCalendar} tone="warn" disabled={busyId === `${booking.id || booking._id}:reschedule`} onClick={() => act(booking, "reschedule")} /> : null}
                {["approved", "rescheduled"].includes(booking.status) ? <IconButton title="Mark arrived" icon={FiUserCheck} disabled={busyId === `${booking.id || booking._id}:arrived`} onClick={() => setAppointmentStatus(booking, "arrived")} /> : null}
                {booking.status === "arrived" ? <IconButton title="Start consultation" icon={FiPlay} disabled={busyId === `${booking.id || booking._id}:in_progress`} onClick={() => setAppointmentStatus(booking, "in_progress")} /> : null}
                {["approved", "rescheduled", "arrived", "in_progress"].includes(booking.status) ? <IconButton title="Complete" icon={FiCheck} disabled={busyId === `${booking.id || booking._id}:complete`} onClick={() => booking.status === "in_progress" || booking.status === "arrived" ? setAppointmentStatus(booking, "completed") : act(booking, "complete")} /> : null}
                {["approved", "rescheduled", "arrived"].includes(booking.status) ? <button type="button" disabled={Boolean(busyId)} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 disabled:opacity-50" onClick={() => setAppointmentStatus(booking, "no_show")}>No-show</button> : null}
                {["pending", "approved", "reschedule_requested", "rescheduled", "arrived"].includes(booking.status) ? <IconButton title="Cancel" icon={FiX} tone="danger" disabled={busyId === `${booking.id || booking._id}:cancel`} onClick={() => act(booking, "cancel")} /> : null}
                {(role === "reception" || role === "admin") ? <IconButton title="Internal note" icon={FiEdit3} disabled={busyId === `${booking.id || booking._id}:note`} onClick={() => act(booking, "note")} /> : null}
                {role === "admin" ? <IconButton title="Delete" icon={FiTrash2} tone="danger" disabled={busyId === `${booking.id || booking._id}:delete`} onClick={() => act(booking, "delete")} /> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
