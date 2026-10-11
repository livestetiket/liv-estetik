import { useCallback, useEffect, useState } from "react";
import { FiEdit3, FiRefreshCw } from "react-icons/fi";
import { getMessages, updateMessage } from "../api";
import { PrimaryButton, SectionShell, EmptyState, IconButton, StatusPill } from "../components/ui/Controls";

export default function Messages() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getMessages());
    } catch (err) {
      setError(err.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (message) => {
    const status = window.prompt("Status: new, read, replied, archived", message.status || "read");
    if (!status) return;
    const internalNotes = window.prompt("Internal notes", message.internalNotes || "") || "";
    try {
      await updateMessage(message.id, { status, internalNotes });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionShell title="Messages" subtitle="Client contact requests shared by reception and admin." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {rows.length === 0 && !loading ? <EmptyState title="No messages" body="Public contact requests will collect here." /> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((message) => (
          <article key={message.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-evergreen-950">{message.name || "Unnamed client"}</h2>
                <p className="mt-1 text-sm text-stone-500">{message.email}</p>
              </div>
              <StatusPill value={message.status} />
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-600">{message.message}</p>
            {message.internalNotes ? <p className="mt-3 rounded-md bg-stone-50 p-3 text-sm text-stone-500">{message.internalNotes}</p> : null}
            <PrimaryButton icon={FiEdit3} className="mt-4" onClick={() => update(message)}>Update</PrimaryButton>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
