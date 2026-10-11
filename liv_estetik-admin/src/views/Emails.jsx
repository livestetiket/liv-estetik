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
      await retryEmailNotification(row.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionShell title="Email Notifications" subtitle="Inspect outgoing email jobs and retry failed deliveries." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {rows.length === 0 && !loading ? <EmptyState title="No notifications" body="Email jobs will appear here in demo mode." /> : null}
        {rows.map((row) => (
          <div key={row.id} className="grid gap-3 border-b border-stone-100 p-4 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="font-semibold text-evergreen-950">{row.subject || "Email notification"}</p>
              <p className="text-sm text-stone-500">{row.to}</p>
            </div>
            <StatusPill value={row.status} />
            <IconButton title="Retry" icon={FiRefreshCw} onClick={() => retry(row)} />
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
