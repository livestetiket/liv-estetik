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
  const serviceLines = Object.entries(services).map(([name, count]) => `• ${name}: ${count}`).join("\n");
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
    `• Clinic visits: ${metrics.metrics?.visits ?? "Unavailable"}`,
    `• Calls generating bookings: ${metrics.metrics?.callsGeneratingBookings ?? "Unavailable"}`,
    `• Follow-ups required: ${metrics.metrics?.followUpsRequired ?? "Unavailable"}`,
    "", `REPORT STATUS: Generated · data completeness ${metrics.metrics?.completeness || "partial"}`,
    `Generated at: ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date())} EAT`,
    "Sharing is manual. Choose the staff group in WhatsApp and send the message there.",
  ].join("\n");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function xmlCell(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function workbookSheet(rows) {
  return rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    let column = columnIndex + 1; let columnName = "";
    while (column) { const remainder = (column - 1) % 26; columnName = String.fromCharCode(65 + remainder) + columnName; column = Math.floor((column - 1) / 26); }
    const ref = `${columnName}${rowIndex + 1}`;
    return typeof value === "number" ? `<c r="${ref}"><v>${value}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlCell(value)}</t></is></c>`;
  }).join("")}</row>`).join("");
}

function zipStore(files) {
  const encoder = new TextEncoder(); const local = []; const central = []; let offset = 0;
  const u16 = (value) => [value & 255, (value >>> 8) & 255];
  const u32 = (value) => [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  const crc32 = (bytes) => { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; };
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name); const data = encoder.encode(content); const crc = crc32(data);
    const header = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameBytes.length), ...u16(0)]);
    local.push(header, nameBytes, data);
    const directory = new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]);
    central.push(directory, nameBytes); offset += header.length + nameBytes.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(Object.keys(files).length), ...u16(Object.keys(files).length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
  return new Blob([...local, ...central, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function makeReportExcel(report) {
  const { period, metrics } = report;
  const summary = [["LIV ESTETIK CLINIC REPORT", period.label], ["Timezone", period.timezone], ["Total bookings", metrics.totalBookings], ["New bookings", metrics.newBookings], ["Registered patients", metrics.totalRegisteredPatients], ["New patient registrations", metrics.newPatientRegistrations], ["Incoming messages", metrics.incomingMessages], ["Calls recorded", metrics.calls], ["Total call records", metrics.totalCalls], ["Clinic visits", metrics.visits], ["PRP sessions planned", metrics.prp.plannedSessions], ["PRP sessions completed", metrics.prp.completedSessions], ["Email attempts", metrics.email.attempts], ["Emails accepted", metrics.email.accepted], ["Failed emails", metrics.email.failed], [""], ["Service", "Bookings"], ...Object.entries(metrics.serviceBookings)];
  const bookings = [["Created at", "Requested appointment", "Client", "Phone", "Service", "Status", "Source"], ...(metrics.bookingDetails || []).map((row) => [row.createdAt, row.requestedStartsAt, row.fullName, row.phone, row.serviceName, row.status, row.source])];
  const calls = [["Logged at", "Phone", "Purpose", "Service", "Linked client", "Linked treatment", "Staff", "Outcome", "Follow-up required", "Notes"], ...(metrics.callDetails || []).map((row) => [row.loggedAt, row.phone, row.purpose, row.serviceName, row.linkedBooking, row.linkedBookingService, row.staffName, row.outcome, row.followUpRequired ? "Yes" : "No", row.notes])];
  const visits = [["Visit date", "Card number", "Name", "Phone", "Service", "Notes"], ...(metrics.visitDetails || []).map((row) => [row.visitDate, row.cardNumber, row.fullName, row.phone, row.serviceName, row.notes])];
  const patients = [["Registered at", "Name", "Card number", "Phone", "Email"], ...(metrics.patientDetails || []).map((row) => [row.createdAt, row.fullName, row.cardNumber, row.phone, row.email])];
  const messages = [["Received at", "Name", "Email", "Status"], ...(metrics.messageDetails || []).map((row) => [row.createdAt, row.name, row.email, row.status])];
  const emails = [["Attempted at", "Template", "Recipient", "Status", "Attempt number"], ...(metrics.emailDetails || []).map((row) => [row.attemptedAt, row.template, row.recipient, row.status, row.attemptNumber])];
  const prp = [["Date", "Patient", "Card number", "Course", "Session", "Status"], ...(metrics.prpSessionDetails || []).map((row) => [row.treatmentDate, row.patientName, row.patientCardNumber, row.courseTitle, row.sessionNumber, row.completed ? "Completed" : "Pending"])];
  const staff = [["Staff", "Role", "Bookings created", "Bookings approved", "Patients registered", "Records updated", "Calls completed"], ...(metrics.staffActivity || []).map((row) => [row.staffName, row.role, row.bookingsCreated, row.bookingsApproved, row.patientsRegistered, row.recordsUpdated, row.callsCompleted])];
  const audit = [["Created at", "Staff", "Role", "Action", "Entity"], ...(metrics.auditDetails || []).map((row) => [row.createdAt, row.staffName, row.role, row.action, row.entityType])];
  const sheets = [summary, bookings, patients, visits, calls, messages, emails, prp, staff, audit];
  const sheetFiles = sheets.map((rows, index) => `xl/worksheets/sheet${index + 1}.xml`);
  const names = ["Summary", "Bookings", "Patients", "Visits", "Calls", "Messages", "Emails", "PRP sessions", "Staff activity", "Audit log"];
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, index) => `<sheet name="${name}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetFiles.map((path, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}</Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheetFiles.map((path, index) => `<Override PartName="/${path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const files = { "[Content_Types].xml": contentTypes, "_rels/.rels": rootRels, "xl/workbook.xml": workbook, "xl/_rels/workbook.xml.rels": rels };
  sheets.forEach((rows, index) => { files[sheetFiles[index]] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${workbookSheet(rows)}</sheetData></worksheet>`; });
  return zipStore(files);
}

function makeReportPng(report) {
  const metrics = report.metrics;
  const serviceRows = Object.entries(metrics.serviceBookings).filter(([, count]) => count > 0).map(([name, count]) => `${name}: ${count}`);
  const lines = ["LIV ESTETIK · DAILY CLINIC REPORT", report.period.label, "", `Bookings received: ${metrics.newBookings}`, `Calls recorded: ${metrics.calls}`, `Clinic visits: ${metrics.visits}`, `Follow-ups needed: ${metrics.followUpsRequired}`, "", "TREATMENT BOOKINGS", ...(serviceRows.length ? serviceRows : ["No treatment bookings recorded"]), "", `Appointments pending: ${metrics.appointmentOutcomes.pending}`, `Confirmed: ${metrics.appointmentOutcomes.confirmed}`, `Completed: ${metrics.appointmentOutcomes.completed}`, "", "Liv Estetik · Addis Ababa"];
  const width = 1080; const lineHeight = 38; const height = Math.max(620, 100 + lines.length * lineHeight);
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#f7f4ef"; context.fillRect(0, 0, width, height);
  context.fillStyle = "#103c2c"; context.fillRect(0, 0, width, 170);
  context.fillStyle = "#f4d88c"; context.font = "700 18px Arial"; context.fillText("LIV ESTETIK · HAIR · SKIN · BODY", 64, 56);
  context.fillStyle = "#fff"; context.font = "700 36px Arial"; context.fillText(lines[0], 64, 112);
  context.fillStyle = "#f4d88c"; context.font = "600 18px Arial"; context.fillText(lines[1], 64, 145);
  let y = 220;
  lines.slice(2).forEach((line) => { const heading = line === "TREATMENT BOOKINGS"; context.fillStyle = heading ? "#103c2c" : "#514c43"; context.font = heading ? "700 20px Arial" : "500 19px Arial"; if (heading) y += 8; context.fillText(line || " ", 68, y); y += lineHeight; });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create report image.")), "image/png"));
}

function Metric({ label, value, detail }) {
  return <article className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-2 font-display text-3xl font-semibold text-evergreen-950">{value ?? "Unavailable"}</p>{detail ? <p className="mt-1 text-xs text-stone-500">{detail}</p> : null}</article>;
}

export default function Reports({ role, permissions = [] }) {
  const canExport = role === "admin" || permissions.includes("reports.export");
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
  const loadHistory = useCallback(async () => { try { setHistory(await getReportHistory(role)); } catch (err) { setError(err.message || "Unable to load report history."); } }, [role]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runPreview = async () => {
    setLoading(true); setError("");
    try { setReport(await previewReport(filters, role)); setGeneratedAt(new Date()); setSavedReportId(""); }
    catch (err) { setError(err.message || "Unable to generate report preview."); }
    finally { setLoading(false); }
  };

  const saveReport = async () => {
    setLoading(true); setError("");
    try { const saved = await generateReport(filters, role); setReport(saved.metrics); setSavedReportId(saved.id || saved._id || ""); setGeneratedAt(new Date(saved.generatedAt)); await loadHistory(); }
    catch (err) { setError(err.message || "Unable to save report."); }
    finally { setLoading(false); }
  };

  const exportExcel = () => { if (report) downloadBlob(makeReportExcel(report), `liv-estetik-${type}-report.xlsx`); };
  const exportPng = async () => { if (!report) return; setError(""); try { downloadBlob(await makeReportPng(report), `liv-estetik-${type}-report.png`); } catch (err) { setError(err.message || "Unable to create the report image."); } };
  const exportCsv = async () => { if (!report || !canExport) return; setError(""); try { downloadBlob(await downloadReportCsv(filters, role), `liv-estetik-${type}-report.csv`); } catch (err) { setError(err.message || "Unable to download the CSV report."); } };

  const shareOnWhatsApp = async () => {
    if (!report) return;
    const text = reportShareText(report);
    const popup = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    if (!popup) { setShareStatus("Your browser blocked the share window. Allow pop-ups and try again."); return; }
    popup.opener = null;
    if (savedReportId) {
      try { await markReportShareOpened(savedReportId, role); await loadHistory(); }
      catch { setShareStatus("WhatsApp opened. Select the staff group and send manually. The share-open event could not be recorded."); return; }
    }
    setShareStatus("WhatsApp opened. Select the staff group and send the message manually; delivery is not tracked.");
  };

  const metrics = report?.metrics;
  const maxTrend = Math.max(1, ...(metrics?.dailyTrend || []).map((row) => Math.max(row.newBookings, row.newPatients || 0, row.calls, row.visits || 0, row.messages || 0, row.completedPrpSessions || 0)));

  return <SectionShell title="Operational reports" subtitle="Period totals from saved bookings, status history, manually logged calls, and reception visits." action={<PrimaryButton icon={FiRefreshCw} onClick={() => { runPreview(); loadHistory(); }}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    <div className="no-print rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">{REPORT_TYPES.map((item) => <button key={item} type="button" aria-pressed={type === item} onClick={() => setType(item)} className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${type === item ? "border-evergreen-900 bg-evergreen-900 text-white" : "border-stone-200 text-stone-600"}`}>{item === "custom" ? "Custom range" : item}</button>)}</div>
      <div className="mt-4 flex flex-wrap items-end gap-3">{type === "custom" ? <><label className="grid gap-1 text-xs font-semibold text-stone-500">From<input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label><label className="grid gap-1 text-xs font-semibold text-stone-500">Through (inclusive)<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label></> : type === "monthly" ? <label className="grid gap-1 text-xs font-semibold text-stone-500">Month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label> : <label className="grid gap-1 text-xs font-semibold text-stone-500">{type === "weekly" ? "Week containing" : "Date"}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-stone-200 px-3 py-2 text-sm" /></label>}
        <PrimaryButton onClick={runPreview} disabled={loading}>{loading ? "Generating…" : "Generate preview"}</PrimaryButton><PrimaryButton onClick={saveReport} disabled={loading}>Save to report history</PrimaryButton>
      </div>
    </div>

    {report ? <section className="report-print-area mt-5">
      <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-champagne-700">LIV ESTETIK · {metrics.period.timezone}</p><h2 className="mt-1 font-display text-2xl font-semibold text-evergreen-950">{metrics.period.label}</h2><p className="text-sm text-stone-500">{metrics.period.type} report · generated {generatedAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(generatedAt) : "just now"} EAT</p></div>{canExport ? <div className="no-print flex flex-wrap gap-2"><PrimaryButton icon={FiDownload} onClick={exportCsv}>Download CSV</PrimaryButton><PrimaryButton icon={FiDownload} onClick={exportExcel}>Download Excel</PrimaryButton><PrimaryButton icon={FiDownload} onClick={exportPng}>Download PNG</PrimaryButton><PrimaryButton icon={FiPrinter} onClick={() => window.print()}>Print / Save PDF</PrimaryButton><PrimaryButton icon={FiShare2} onClick={shareOnWhatsApp}>Share on WhatsApp</PrimaryButton></div> : null}</header>
      {shareStatus ? <p role="status" className="no-print mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{shareStatus}</p> : null}
      <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Data completeness: {metrics.metrics.completeness}. Call and visit records are entered by staff.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total bookings" value={metrics.metrics.totalBookings} /><Metric label="New bookings" value={metrics.metrics.newBookings} detail="Created in reporting period" /><Metric label="Patients registered" value={metrics.metrics.totalRegisteredPatients} detail={`${metrics.metrics.newPatientRegistrations} registered in this period`} /><Metric label="Clinic visits" value={metrics.metrics.visits} detail={`${metrics.metrics.totalVisits} total records`} />
        <Metric label="Incoming messages" value={metrics.metrics.incomingMessages} detail={`${metrics.metrics.totalIncomingMessages} total records`} /><Metric label="PRP sessions completed" value={metrics.metrics.prp.sessionsCompletedInPeriod} detail={`${metrics.metrics.prp.completedSessions} completed across ${metrics.metrics.prp.totalCourses} courses`} /><Metric label="Calls recorded" value={metrics.metrics.calls} detail={`${metrics.metrics.totalCalls} total records · ${metrics.metrics.callsGeneratingBookings} linked to bookings`} /><Metric label="Pending follow-ups" value={metrics.metrics.pendingFollowUps} detail={`${metrics.metrics.completedFollowUps} completed during this period`} />
        <Metric label="Pending appointments" value={metrics.metrics.appointmentOutcomes.pending} /><Metric label="Approved appointments" value={metrics.metrics.appointmentOutcomes.confirmed} /><Metric label="Cancelled appointments" value={metrics.metrics.appointmentOutcomes.cancelled} /><Metric label="Failed emails" value={metrics.metrics.email.failed} detail={`${metrics.metrics.email.accepted} accepted by provider · ${metrics.metrics.email.delivered} delivered`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">PRP treatment progress</h3><p className="mb-2 text-xs text-stone-500">Actual sessions and treatment dates in the patient records</p><div className="grid grid-cols-2 gap-3 text-sm"><p>Total courses <strong className="float-right">{metrics.metrics.prp.totalCourses}</strong></p><p>Sessions planned <strong className="float-right">{metrics.metrics.prp.plannedSessions}</strong></p><p>Completed <strong className="float-right">{metrics.metrics.prp.completedSessions}</strong></p><p>Pending <strong className="float-right">{metrics.metrics.prp.pendingSessions}</strong></p><p>Completed in period <strong className="float-right">{metrics.metrics.prp.sessionsCompletedInPeriod}</strong></p><p>Overall completion <strong className="float-right">{metrics.metrics.prp.completionProgress}%</strong></p></div></section>
        <section className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Email activity</h3><p className="mb-2 text-xs text-stone-500">Accepted means the provider accepted the message; delivery is reported only when available.</p><div className="grid grid-cols-2 gap-3 text-sm"><p>Attempts <strong className="float-right">{metrics.metrics.email.attempts}</strong></p><p>Accepted <strong className="float-right">{metrics.metrics.email.accepted}</strong></p><p>Delivered <strong className="float-right">{metrics.metrics.email.delivered}</strong></p><p>Failed <strong className="float-right">{metrics.metrics.email.failed}</strong></p><p>Pending <strong className="float-right">{metrics.metrics.email.pending}</strong></p><p>Console simulations <strong className="float-right">{metrics.metrics.email.simulated}</strong></p></div></section>
      </div>
      <section className="mt-4 rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Staff activity (audit log)</h3><p className="mb-2 text-xs text-stone-500">Counts reflect recorded staff actions; actions from before audit logging are not inferred.</p>{!metrics.metrics.staffActivity.length ? <p className="text-sm text-stone-500">No staff actions were recorded in this period.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-stone-200 text-xs uppercase text-stone-500"><th className="py-2 pr-3">Staff</th><th className="py-2 pr-3">Role</th><th className="py-2 pr-3">Bookings made</th><th className="py-2 pr-3">Approved</th><th className="py-2 pr-3">Patients</th><th className="py-2 pr-3">Updated</th><th className="py-2">Calls completed</th></tr></thead><tbody>{metrics.metrics.staffActivity.map((row) => <tr key={row.staffId || `${row.role}-${row.staffName}`} className="border-b border-stone-100"><td className="py-2 pr-3">{row.staffName}</td><td className="py-2 pr-3 capitalize">{row.role.replaceAll("_", " ")}</td><td className="py-2 pr-3">{row.bookingsCreated}</td><td className="py-2 pr-3">{row.bookingsApproved}</td><td className="py-2 pr-3">{row.patientsRegistered}</td><td className="py-2 pr-3">{row.recordsUpdated}</td><td className="py-2">{row.callsCompleted}</td></tr>)}</tbody></table></div>}</section>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Service bookings</h3><p className="mb-2 text-xs text-stone-500">New appointment records, regardless of current status</p>{Object.entries(metrics.metrics.serviceBookings).map(([name, count]) => <div key={name} className="flex justify-between border-t border-stone-100 py-2 text-sm"><span>{name}</span><strong>{count}</strong></div>)}</section>
        <section className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Appointment outcomes</h3><p className="mb-2 text-xs text-stone-500">Current status for appointments in the selected period; cancellations and no-shows use status history</p>{Object.entries(metrics.metrics.appointmentOutcomes).map(([name, count]) => <div key={name} className="flex justify-between border-t border-stone-100 py-2 text-sm capitalize"><span>{name.replaceAll(/([A-Z])/g, " $1")}</span><strong>{count}</strong></div>)}</section>
      </div>
      <section className="mt-4 rounded-lg border border-stone-200 bg-white p-4"><h3 className="font-semibold text-evergreen-950">Booking sources</h3><p className="mb-2 text-xs text-stone-500">Source is tracked separately from service. Historical records without source attribution appear as unknown.</p><div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(metrics.metrics.bookingsBySource).map(([name, count]) => <div key={name} className="flex justify-between border-t border-stone-100 py-2 text-sm"><span className="capitalize">{name.replaceAll("_", " ")}</span><strong>{count}</strong></div>)}</div></section>
      <section className="mt-4 rounded-lg border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold text-evergreen-950">Daily activity</h3><p className="text-xs text-stone-500">Bookings · patients · calls · visits · messages · completed PRP sessions</p></div>
        {!metrics.dailyTrend.length ? <EmptyState title="No daily data" body="Activity appears after records exist for this period." /> : <div className="mt-4 flex min-h-48 items-end gap-1 overflow-x-auto">{metrics.dailyTrend.map((row) => <div key={row.date} title={`${row.date}: ${row.newBookings} bookings, ${row.newPatients || 0} patients, ${row.calls} calls, ${row.visits || 0} visits, ${row.messages || 0} messages, ${row.completedPrpSessions || 0} PRP sessions`} className="flex h-44 min-w-8 flex-col justify-end gap-1 text-center"><div className="mx-auto flex h-36 items-end gap-0.5"><span className="w-1.5 bg-evergreen-900" style={{ height: `${Math.max(2, row.newBookings / maxTrend * 100)}%` }} /><span className="w-1.5 bg-champagne-600" style={{ height: `${Math.max(2, (row.newPatients || 0) / maxTrend * 100)}%` }} /><span className="w-1.5 bg-indigo-400" style={{ height: `${Math.max(2, row.calls / maxTrend * 100)}%` }} /><span className="w-1.5 bg-cyan-600" style={{ height: `${Math.max(2, (row.visits || 0) / maxTrend * 100)}%` }} /><span className="w-1.5 bg-amber-500" style={{ height: `${Math.max(2, (row.messages || 0) / maxTrend * 100)}%` }} /><span className="w-1.5 bg-rose-500" style={{ height: `${Math.max(2, (row.completedPrpSessions || 0) / maxTrend * 100)}%` }} /></div><span className="text-[9px] text-stone-500">{row.date.slice(-2)}</span></div>)}</div>}
        <p className="mt-2 text-xs text-stone-500">Previous period new bookings: {metrics.metrics.comparison.previousNewBookings} · Change: {metrics.metrics.comparison.percentChange === null ? "Baseline unavailable" : `${metrics.metrics.comparison.percentChange > 0 ? "+" : ""}${metrics.metrics.comparison.percentChange.toFixed(1)}%`}</p>
      </section>
    </section> : <div className="mt-5"><EmptyState title="Choose a reporting period" body="Generate a preview to view verified totals from saved records." /></div>}

    <section className="no-print mt-6 rounded-lg border border-stone-200 bg-white p-4"><h2 className="font-display text-xl font-semibold text-evergreen-950">Report history</h2>{!history.length ? <EmptyState title="No saved reports" body="Reports you save will appear here." /> : <div className="mt-3 grid gap-2">{history.map((item) => <article key={item.id || item._id} className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 py-3 text-sm"><div><strong className="capitalize text-evergreen-950">{item.type}</strong><span className="mx-2 text-stone-400">·</span><span>{item.metrics?.period?.label || "Period"}</span><p className="text-xs text-stone-500">Generated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(new Date(item.generatedAt))} EAT by {item.generatedBy?.name || "system"}</p></div><span className="text-xs text-stone-500">{item.shareOpenedAt ? "WhatsApp share link opened" : "Ready to share manually"}</span></article>)}</div>}</section>
  </SectionShell>;
}
