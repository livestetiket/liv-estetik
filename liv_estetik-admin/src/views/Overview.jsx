import { useCallback, useEffect, useState } from "react";
import { FiActivity, FiRefreshCw } from "react-icons/fi";
import { getDashboardSummary } from "../api";
import { PrimaryButton, SectionShell, EmptyState } from "../components/ui/Controls";

const SUMMARY_LABELS = {
  totalUsers: "Staff accounts",
  totalServices: "Services",
  pendingBookings: "Pending bookings",
  approvedBookings: "Approved bookings",
  failedEmails: "Failed emails",
  newMessages: "New messages",
  pendingBookingRequests: "Pending booking requests",
  approvedAppointmentsToday: "Approved today",
  rejectedRequestsThisWeek: "Rejected this week",
  rescheduledRequests: "Rescheduled requests",
  newContactMessages: "New contact messages",
};

const NAV_TARGETS = {
  messages: "messages",
  pendingBookings: "bookings",
  approvedBookings: "bookings",
  pendingBookingRequests: "bookings",
  approvedAppointmentsToday: "bookings",
  rejectedRequestsThisWeek: "bookings",
  rescheduledRequests: "bookings",
  newContactMessages: "messages",
};

export default function Overview({ role, setActiveView }) {
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardSummary(role);
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load overview.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const statEntries = Object.entries(summary).filter(([key]) => SUMMARY_LABELS[key]);

  return (
    <SectionShell
      title={`${role === "admin" ? "Admin" : "Reception"} Overview`}
      subtitle="A quick pulse of bookings, messages, and staff activity."
      action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}
    >
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statEntries.length ? statEntries.map(([key, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveView(NAV_TARGETS[key] || "overview")}
            className="rounded-lg border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">{SUMMARY_LABELS[key]}</p>
            <p className="mt-3 font-display text-4xl font-semibold text-evergreen-950">{value}</p>
          </button>
        )) : (
          [
            ["Pending items", "-"],
            ["Messages", "-"],
            ["Slots", "-"],
            ["Staff", "-"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-stone-200 bg-white p-5 text-left shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">{label}</p>
              <p className="mt-3 font-display text-4xl font-semibold text-evergreen-950">{value}</p>
            </div>
          ))
        )}
      </div>
    </SectionShell>
  );
}
