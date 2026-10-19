import { useCallback, useEffect, useMemo, useState } from "react";
import { FiDownload, FiPrinter, FiRefreshCw, FiShare2 } from "react-icons/fi";
import { downloadReportCsv, generateReport, getReportHistory, markReportShareOpened, previewReport } from "../api";
import { PrimaryButton, SectionShell, EmptyState } from "../components/ui/Controls";

const TZ = "Africa/Addis_Ababa";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const monthNow = () => today().slice(0, 7);
const REPORT_TYPES = ["daily", "weekly", "monthly", "custom"];

function reportShareText(report) {
  const metrics = report.metrics || report;
  const period = metrics.period?.label || "Selected period";
  const services = metrics.metrics?.serviceBookings || {};
  const outcomes = metrics.metrics?.appointmentOutcomes || {};
  const names = ["Hair Transplant Consultation", "Hair Transplant Procedure", "PRP Treatment", "Dermatology Consultation", "Facial Treatment", "Body Treatment"];
  const serviceLines = names.map((name) => `• ${name}: ${services[name] ?? "Unavailable"}`).join("\n");
  const followerChange = metrics.metrics?.followerChange;
  return [
    `LIV ESTETIK — ${(metrics.period?.type || "daily").toUpperCase()} REPORT`,
    `Reporting period: ${period}`,
    "", "BOOKINGS", serviceLines,
    `• Total new bookings: ${metrics.metrics?.newBookings ?? "Unavailable"}`,
    "", "APPOINTMENT OUTCOMES",
    `• Confirmed: ${outcomes.confirmed ?? "Unavailable"}`,
    `• Completed: ${outcomes.completed ?? "Unavailable"}`,
    `• Cancelled: ${outcomes.cancelled ?? "Unavailable"}`,
    `• No-show: ${outcomes.noShow ?? "Unavailable"}`,
    `• Pending: ${outcomes.pending ?? "Unavailable"}`,
    "", "CALL ACTIVITY",
    `• Calls recorded: ${metrics.metrics?.calls ?? "Unavailable"}`,
    `• Calls generating bookings: ${metrics.metrics?.callsGeneratingBookings ?? "Unavailable"}`,
    `• Follow-ups required: ${metrics.metrics?.followUpsRequired ?? "Unavailable"}`,
    "", "SOCIAL MEDIA",
    `• Posts published: ${metrics.metrics?.postsPublished ?? "Unavailable"}`,
    `• TikTok followers: ${metrics.metrics?.latestTikTokFollowers ?? "Unavailable"}`,
    `• Follower change: ${followerChange === null || followerChange === undefined ? "Baseline unavailable" : `${followerChange > 0 ? "+" : ""}${followerChange}`}`,
    "", `REPORT STATUS: Generated · data completeness ${metrics.metrics?.completeness || "partial"}`,
    `Generated at: ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date())} EAT`,
    "Sharing is manual. Choose the staff group in WhatsApp and send the message there.",
  ].join("\n");
}

function Metric({ label, value, detail }) {
  return <article className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-2 font-display text-3xl font-semibold text-evergreen-950">{value ?? "Unavailable"}</p>{detail ? <p className="mt-1 text-xs text-stone-500">{detail}</p> : null}</article>;
}

export default function Reports() {
  const [type, setType] = useState("daily");
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(monthNow());
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [savedReportId, setSavedReportId] = useState("");
  const [generatedAt, setGeneratedAt] = useState(null);

  const filters = useMemo(() => type === "custom" ? { type, from, to } : type === "monthly" ? { type, month } : { type, date }, [type, date, month, from, to]);
  const loadHistory = useCallback(async () => { try { setHistory(await getReportHistory()); } catch (err) { setError(err.message || "Unable to load report history."); } }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runPreview = async () => {
    setLoading(true); setError("");
    try { setReport(await previewReport(filters)); setGeneratedAt(new Date()); setSavedReportId(""); }
    catch (err) { setError(err.message || "Unable to generate report preview."); }
    finally { setLoading(false); }
  };

  const saveReport = async () => {
    setLoading(true); setError("");
    try { const saved = await generateReport(filters); setReport(saved.metrics); setSavedReportId(saved.id || saved._id || ""); setGeneratedAt(new Date(saved.generatedAt)); await loadHistory(); }
    catch (err) { setError(err.message || "Unable to save report."); }
    finally { setLoading(false); }
  };

  const exportCsv = async () => {
    setError("");
    try { const blob = await downloadReportCsv(filters); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `liv-estetik-${type}-report.csv`; a.click(); URL.revokeObjectURL(url); }
    catch (err) { setError(err.message || "Unable to export this report."); }
  };

  const shareOnWhatsApp = async () => {
    if (!report) return;
    const text = reportShareText(report);
    const popup = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    if (!popup) { setShareStatus("Your browser blocked the share window. Allow pop-ups and try again."); return; }
    popup.opener = null;
    if (savedReportId) {
      try { await markReportShareOpened(savedReportId); await loadHistory(); }
      catch { setShareStatus("WhatsApp opened. Select the staff group and send manually. The share-open event could not be recorded."); return; }
    }
    setShareStatus("WhatsApp opened. Select the staff group and send the message manually; delivery is not tracked.");
  };

  const metrics = report?.metrics;
  const maxTrend = Math.max(1, ...(metrics?.dailyTrend || []).map((row) => Math.max(row.newBookings, row.calls, row.posts)));

  return <SectionShell title="Operational reports" subtitle="Period totals from saved bookings, status history, manually logged calls, social posts, and follower observations." action={<PrimaryButton icon={FiRefreshCw} onClick={() => { runPreview(); loadHistory(); }}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    <div className="no-print rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">{REPORT_TYPES.map((item) => <button key={item} type="button" aria-pressed={type === item} onClick={() => setType(item)} className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${type === item ? "border-evergreen-900 bg-evergreen-900 text-white" : "border-stone-200 text-stone-600"}`}>{item === "custom" ? "Custom range" : item}</button>)}</div>
      <div className="mt-4 flex flex-wrap items-end gap-3">{type === "custom" ? <><label className="grid gap-1 text-xs font-semibold text-stone-500">From<input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label><label className="grid gap-1 text-xs font-semibold text-stone-500">Through (inclusive)<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label></> : type === "monthly" ? <label className="grid gap-1 text-xs font-semibold text-stone-500">Month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label> : <label className="grid gap-1 text-xs font-semibold text-stone-500">{type === "weekly" ? "Week containing" : "Date"}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label>}
        <PrimaryButton onClick={runPreview} disabled={loading}>{loading ? "Generating…" : "Generate preview"}</PrimaryButton><PrimaryButton onClick={saveReport} disabled={loading}>Save to report history</PrimaryButton>
      </div>
    </div>

    {report ? <section className="report-print-area mt-5">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-champagne-700">LIV ESTETIK · {metrics.period.timezone}</p><h2 className="mt-1 font-display text-2xl font-semibold text-evergreen-950">{metrics.period.label}</h2><p className="text-sm text-stone-500">{metrics.period.type} report · generated {generatedAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(generatedAt) : "just now"} EAT</p></div><div className="no-print flex flex-wrap gap-2"><PrimaryButton icon={FiDownload} onClick={exportCsv}>Export CSV</PrimaryButton><PrimaryButton icon={FiPrinter} onClick={() => window.print()}>Print / Save PDF</PrimaryButton><PrimaryButton icon={FiShare2} onClick={shareOnWhatsApp}>Share on WhatsApp</PrimaryButton></div></header>
      {shareStatus ? <p role="status" className="no-print mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{shareStatus}</p> : null}
      <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Data completeness: {metrics.metrics.completeness}. Calls and social records are manually entered. TikTok follower values reflect the latest recorded observation.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="New bookings" value={metrics.metrics.newBookings} detail="Created in reporting period" /><Metric label="Unique patients" value={metrics.metrics.uniquePatients} /><Metric label="Patient registrations" value={metrics.metrics.newPatientRegistrations} />
        <Metric label="Calls recorded" value={metrics.metrics.calls} /><Metric label="Calls linked to bookings" value={metrics.metrics.callsGeneratingBookings} /><Metric label="Follow-ups required" value={metrics.metrics.followUpsRequired} /><Metric label="Posts published" value={metrics.metrics.postsPublished} /><Metric label="TikTok followers" value={metrics.metrics.latestTikTokFollowers?.toLocaleString() || "Unavailable"} detail={metrics.metrics.followerObservationSource ? `Source: ${metrics.metrics.followerObservationSource}` : "No observation recorded"} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Service bookings</h3><p className="mb-2 text-xs text-stone-500">New appointment records, regardless of current status</p>{Object.entries(metrics.metrics.serviceBookings).map(([name, count]) => <div key={name} className="flex justify-between border-t border-stone-100 py-2 text-sm"><span>{name}</span><strong>{count}</strong></div>)}</section>
        <section className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Appointment outcomes</h3><p className="mb-2 text-xs text-stone-500">Current status for appointments in the selected period; cancellations and no-shows use status history</p>{Object.entries(metrics.metrics.appointmentOutcomes).map(([name, count]) => <div key={name} className="flex justify-between border-t border-stone-100 py-2 text-sm capitalize"><span>{name.replaceAll(/([A-Z])/g, " $1")}</span><strong>{count}</strong></div>)}</section>
      </div>
      <section className="mt-4 rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Booking sources</h3><p className="mb-2 text-xs text-stone-500">Source is tracked separately from service. Historical records without source attribution appear as unknown.</p><div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(metrics.metrics.bookingsBySource).map(([name, count]) => <div key={name} className="flex justify-between border-t border-stone-100 py-2 text-sm"><span className="capitalize">{name.replaceAll("_", " ")}</span><strong>{count}</strong></div>)}</div></section>
      <section className="mt-4 rounded-lg border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold text-evergreen-950">Daily activity</h3><p className="text-xs text-stone-500">Bookings created · calls logged · posts published</p></div>
        {!metrics.dailyTrend.length ? <EmptyState title="No daily data" body="Activity appears after records exist for this period." /> : <div className="mt-4 flex min-h-48 items-end gap-1 overflow-x-auto">{metrics.dailyTrend.map((row) => <div key={row.date} title={`${row.date}: ${row.newBookings} bookings, ${row.calls} calls, ${row.posts} posts`} className="flex h-44 min-w-7 flex-col justify-end gap-1 text-center"><div className="mx-auto flex h-36 items-end gap-0.5"><span className="w-1.5 bg-evergreen-900" style={{ height: `${Math.max(2, row.newBookings / maxTrend * 100)}%` }} /><span className="w-1.5 bg-champagne-600" style={{ height: `${Math.max(2, row.calls / maxTrend * 100)}%` }} /><span className="w-1.5 bg-stone-400" style={{ height: `${Math.max(2, row.posts / maxTrend * 100)}%` }} /></div><span className="text-[9px] text-stone-500">{row.date.slice(-2)}</span></div>)}</div>}
        <p className="mt-2 text-xs text-stone-500">Previous period new bookings: {metrics.metrics.comparison.previousNewBookings} · Change: {metrics.metrics.comparison.percentChange === null ? "Baseline unavailable" : `${metrics.metrics.comparison.percentChange > 0 ? "+" : ""}${metrics.metrics.comparison.percentChange.toFixed(1)}%`}</p>
      </section>
    </section> : <div className="mt-5"><EmptyState title="Choose a reporting period" body="Generate a preview to view verified totals from saved records." /></div>}

    <section className="no-print mt-6 rounded-lg border border-stone-200 bg-white p-4"><h2 className="font-display text-xl font-semibold text-evergreen-950">Report history</h2>{!history.length ? <EmptyState title="No saved reports" body="Reports you save will appear here." /> : <div className="mt-3 grid gap-2">{history.map((item) => <article key={item.id || item._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 py-3 text-sm"><div><strong className="capitalize text-evergreen-950">{item.type}</strong><span className="mx-2 text-stone-400">·</span><span>{item.metrics?.period?.label || "Period"}</span><p className="text-xs text-stone-500">Generated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(item.generatedAt))} EAT by {item.generatedBy?.name || "system"}</p></div><span className="text-xs text-stone-500">{item.shareOpenedAt ? "WhatsApp share link opened" : "Ready to share manually"}</span></article>)}</div>}</section>
  </SectionShell>;
}
