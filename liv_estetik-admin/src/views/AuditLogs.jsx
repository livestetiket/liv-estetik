import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { getAuditLogs } from "../api";
import { PrimaryButton, SectionShell, EmptyState } from "../components/ui/Controls";

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getAuditLogs());
    } catch (err) {
      setError(err.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SectionShell title="Audit Logs" subtitle="A read-only trail for sensitive admin actions." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {rows.length === 0 && !loading ? <EmptyState title="No audit logs" body="Admin activity will appear here." /> : null}
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 border-b border-stone-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div>
              <p className="font-semibold text-evergreen-950">{row.action || "Audit event"}</p>
              <p className="text-sm text-stone-500">{row.entity || "Resource"}</p>
            </div>
            <p className="text-sm text-stone-500">{row.user?.name || "System"}</p>
            <p className="text-sm text-stone-400">{new Date(row.createdAt || row.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
