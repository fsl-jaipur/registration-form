import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type DailyUpdate = {
  _id: string;
  authorName?: string;
  authorEmail?: string;
  authorPhone?: string;
  authorRole?: string;
  message: string;
  trelloCardUrl?: string | null;
  createdAt?: string;
  status?: "todo" | "doing" | "done";
};

const AdminDailyUpdates = () => {
  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/daily-updates`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch daily updates");
        }
        setUpdates(Array.isArray(data?.updates) ? data.updates : []);
      } catch (err) {
        console.error("Fetch daily updates failed", err);
        setError(err instanceof Error ? err.message : "Failed to load daily updates.");
      } finally {
        setLoading(false);
      }
    };

    void fetchUpdates();
  }, [apiBase]);

  const handleStatusChange = async (updateId: string, status: "todo" | "doing" | "done") => {
    try {
      setUpdatingId(updateId);
      const res = await fetch(`${apiBase}/daily-updates/${updateId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update status");
      }
      setUpdates((prev) =>
        prev.map((item) => (item._id === updateId ? data.update : item)),
      );
    } catch (err) {
      console.error("Status update failed", err);
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="container mx-auto px-4 py-10 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Admin Control Center</p>
          <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
            Student Daily Updates
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Every update creates a Trello card. Review the latest student progress here.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
            Loading daily updates...
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && updates.length === 0 && (
          <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
            No daily updates yet.
          </div>
        )}

        {!loading && !error && updates.length > 0 && (
          <div className="grid gap-4">
            {updates.map((update) => (
              <article
                key={update._id}
                className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {update.authorName || "Student"}
                      {update.authorRole ? ` · ${update.authorRole}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {update.authorEmail || "No email"}
                      {update.authorPhone ? ` · ${update.authorPhone}` : ""}
                    </p>
                  </div>
                  {update.trelloCardUrl && (
                    <a
                      href={update.trelloCardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Trello card
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Status</span>
                  <select
                    value={update.status || "todo"}
                    onChange={(e) =>
                      handleStatusChange(update._id, e.target.value as "todo" | "doing" | "done")
                    }
                    disabled={updatingId === update._id}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-70"
                  >
                    <option value="todo">To Do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                  {updatingId === update._id && (
                    <span className="text-xs text-slate-400">Updating...</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{update.message}</p>
                {update.createdAt && (
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    {new Date(update.createdAt).toLocaleString("en-GB")}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDailyUpdates;
