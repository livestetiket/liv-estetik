import { useCallback, useEffect, useState } from "react";
import { FiDownload, FiRefreshCw } from "react-icons/fi";
import { downloadAuditLogsCsv, getAuditLogs, getRoleCatalog, getUsers } from "../api";
import { PrimaryButton, SectionShell, EmptyState, Field, Select, TextInput } from "../components/ui/Controls";

export default function AuditLogs({ role, permissions = [] }) {
  const canExport = role === "admin" || permissions.includes("reports.export");
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", actor: "", role: "", action: "", entityType: "", patientReference: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs(filters);
      setRows(data);
    } catch (err) {
      setError(err.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const exportCsv = async () => {
    try {
      const blob = await downloadAuditLogsCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = "liv-estetik-audit-log.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message || "Unable to export audit logs."); }
  };

  useEffect(() => { Promise.all([getUsers(), getRoleCatalog()]).then(([staff, catalog]) => { setUsers(staff); setRoles(catalog.roles || []); }).catch(() => {}); }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionShell title="Audit Logs" subtitle="Read-only records of who changed which clinic records and when." action={<div className="flex gap-2">{canExport ? <PrimaryButton icon={FiDownload} onClick={exportCsv}>Export CSV</PrimaryButton> : null}<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton></div>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="From"><TextInput type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Field><Field label="To"><TextInput type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Field>
        <Field label="Staff member"><Select value={filters.actor} onChange={(e) => setFilters({ ...filters, actor: e.target.value })}><option value="">All staff</option>{users.map((user) => <option key={user.id || user._id} value={user.id || user._id}>{user.name}</option>)}</Select></Field>
        <Field label="Role"><Select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}><option value="">All roles</option>{roles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}</Select></Field>
        <Field label="Action"><TextInput placeholder="e.g. booking.approved" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} /></Field>
        <Field label="Record type"><Select value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}><option value="">All records</option>{["Booking", "Customer", "PrpCourse", "CallActivity", "DailyVisit", "User", "Role", "Service", "Testimonial", "Message", "ClinicSettings", "EmailNotification"].map((type) => <option key={type}>{type}</option>)}</Select></Field>
        <Field label="Patient reference"><TextInput placeholder="Card number or patient ID" value={filters.patientReference} onChange={(e) => setFilters({ ...filters, patientReference: e.target.value })} /></Field>
      </div>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {rows.length === 0 && !loading ? <EmptyState title="No audit logs" body="Admin activity will appear here." /> : null}
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 border-b border-stone-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div>
              <p className="font-semibold text-evergreen-950">{row.action || "Audit event"}</p>
              <p className="text-sm text-stone-500">{row.entityType || row.entity || "Resource"} {row.entityId ? `· ${row.entityId}` : ""}</p>
            </div>
            <p className="text-sm text-stone-500">{row.user?.name || row.actorName || "System"} · {row.user?.role || row.actorRole || "system"}</p>
            <div><p className="text-sm text-stone-400">{new Date(row.createdAt || row.timestamp).toLocaleString("en-GB", { timeZone: "Africa/Addis_Ababa" })} EAT</p>{row.requestId ? <p className="text-[10px] text-stone-400">Request {row.requestId}</p> : null}</div>
            {row.metadata && Object.keys(row.metadata).length ? <details className="text-xs text-stone-500 md:col-span-3"><summary className="cursor-pointer">Changed values and details</summary><pre className="mt-2 overflow-auto rounded bg-stone-50 p-2">{JSON.stringify(row.metadata, null, 2)}</pre></details> : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
