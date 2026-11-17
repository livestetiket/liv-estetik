import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { getEmailNotifications, retryEmailNotification } from "../api";
import { PrimaryButton, SectionShell, StatusPill, EmptyState, IconButton } from "../components/ui/Controls";

export default function Emails() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getEmailNotifications());
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (row) => {
    try {
      await retryEmailNotification(row.id || row._id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionShell title="Email Notifications" subtitle="Inspect email attempts. Sent means accepted by the configured provider; delivery is confirmed only when the provider reports it." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {rows.length === 0 && !loading ? <EmptyState title="No notifications" body="Email jobs will appear here in demo mode." /> : null}
        {rows.map((row) => (
          <div key={row.id} className="grid gap-3 border-b border-stone-100 p-4 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="font-semibold text-evergreen-950">{row.subject || "Email notification"}</p>
              <p className="text-sm text-stone-500">{row.to} · {row.template?.replaceAll("_", " ")}</p>
              <p className="text-xs text-stone-400">Attempts: {row.attempts || 0}{row.providerMessageId ? ` · Provider reference: ${row.providerMessageId}` : ""}</p>
              {row.error ? <p className="mt-1 text-xs text-rose-700">{row.error}</p> : null}
            </div>
            <StatusPill value={row.status} />
            {row.status === "failed" ? <IconButton title="Retry failed email" icon={FiRefreshCw} onClick={() => retry(row)} /> : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
