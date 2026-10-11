import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiCalendar, FiEdit3, FiEye, FiTrash2, FiX, FiRefreshCw } from "react-icons/fi";
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
} from "../api";
import { PrimaryButton, SectionShell, IconButton, StatusPill, EmptyState, getServicesLabel, getSlotLabel } from "../components/ui/Controls";

export default function Bookings({ role }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
        await cancelBooking(id, reason || "");
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
    <SectionShell title="Bookings" subtitle="Review appointments and move each client through the booking lifecycle." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
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
      {rows.length === 0 && !loading ? <EmptyState title="No bookings yet" body="New demo booking requests will appear here." /> : null}
      <div className="grid gap-3">
        {rows.map((booking) => (
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
                {(role === "admin" || role === "reception") ? <IconButton title="Approve" icon={FiCheck} tone="good" disabled={busyId === `${booking.id || booking._id}:approve`} onClick={() => act(booking, "approve")} /> : null}
                {(role === "admin" || role === "reception") ? <IconButton title="Reject" icon={FiX} tone="danger" disabled={busyId === `${booking.id || booking._id}:reject`} onClick={() => act(booking, "reject")} /> : null}
                {(role === "admin" || role === "reception") ? <IconButton title="Reschedule" icon={FiCalendar} tone="warn" disabled={busyId === `${booking.id || booking._id}:reschedule`} onClick={() => act(booking, "reschedule")} /> : null}
                {(role === "reception" || role === "admin") ? <IconButton title="Complete" icon={FiCheck} disabled={busyId === `${booking.id || booking._id}:complete`} onClick={() => act(booking, "complete")} /> : null}
                {(role === "reception" || role === "admin") ? <IconButton title="Cancel" icon={FiX} tone="danger" disabled={busyId === `${booking.id || booking._id}:cancel`} onClick={() => act(booking, "cancel")} /> : null}
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
