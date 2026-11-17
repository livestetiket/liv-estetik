import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiCalendar, FiMail, FiMessageSquare, FiRefreshCw, FiUsers } from "react-icons/fi";
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

const SUMMARY_ICONS = {
  totalUsers: FiUsers,
  totalServices: FiCalendar,
  pendingBookings: FiAlertCircle,
  approvedBookings: FiCalendar,
  failedEmails: FiMail,
  newMessages: FiMessageSquare,
  pendingBookingRequests: FiAlertCircle,
  approvedAppointmentsToday: FiCalendar,
  rejectedRequestsThisWeek: FiCalendar,
  rescheduledRequests: FiCalendar,
  newContactMessages: FiMessageSquare,
};

const NAV_TARGETS = {
  messages: "messages",
  newMessages: "messages",
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
  const attentionItems = [
    { key: "pendingBookings", label: "Booking requests need review", view: "bookings" },
    { key: "pendingBookingRequests", label: "Booking requests need review", view: "bookings" },
    { key: "failedEmails", label: "Email deliveries need attention", view: "emails" },
    { key: "newMessages", label: "New messages are waiting", view: "messages" },
    { key: "newContactMessages", label: "New messages are waiting", view: "messages" },
    { key: "rescheduledRequests", label: "Reschedule requests need review", view: "bookings" },
  ].filter((item) => Number(summary[item.key]) > 0);

  return (
    <SectionShell
      title={`${role === "admin" ? "Admin" : "Reception"} Overview`}
      subtitle="Current operational totals from your clinic workspace."
      action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}
    >
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {statEntries.length ? <div className="overview-metrics grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {statEntries.map(([key, value]) => {
          const Icon = SUMMARY_ICONS[key] || FiCalendar;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(NAV_TARGETS[key] || (key === "totalUsers" ? "users" : key === "totalServices" ? "services" : "overview"))}
              className="overview-metric"
            >
              <span className="overview-metric-icon"><Icon aria-hidden="true" /></span>
              <span className="overview-metric-copy">
                <span>{SUMMARY_LABELS[key]}</span>
                <strong>{typeof value === "number" ? new Intl.NumberFormat().format(value) : value}</strong>
              </span>
              <span className="overview-metric-arrow" aria-hidden="true">→</span>
            </button>
          );
        })}
      </div> : null}
      {!statEntries.length && !loading ? (
        <EmptyState title="Overview data unavailable" body="The dashboard did not return operational totals. Refresh to try again." />
      ) : null}
      {loading && !statEntries.length ? (
        <p className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500" role="status">Loading current clinic totals…</p>
      ) : null}
      <section className="overview-attention rounded-lg border border-stone-200 bg-white">
        <div className="overview-panel-heading">
          <div>
            <p className="overview-section-kicker">Follow-up</p>
            <h2>Items to review</h2>
          </div>
          <span>Based on current totals</span>
        </div>
        {attentionItems.length ? (
          <div className="overview-attention-list">
            {attentionItems.map((item) => (
              <button key={item.key} type="button" onClick={() => setActiveView(item.view)}>
                <span className="overview-attention-indicator" aria-hidden="true" />
                <span>{item.label}</span>
                <strong>{new Intl.NumberFormat().format(Number(summary[item.key]))}</strong>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="overview-attention-empty">No outstanding items are reported right now.</p>
        )}
      </section>
    </SectionShell>
  );
}
