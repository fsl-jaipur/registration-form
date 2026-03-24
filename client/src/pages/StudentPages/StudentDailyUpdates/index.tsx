import { useEffect, useState } from "react";
import { ExternalLink, Send } from "lucide-react";

type DailyUpdate = {
  _id: string;
  message: string;
  trelloCardUrl?: string | null;
  createdAt?: string;
};

const StudentDailyUpdates = () => {
  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/daily-updates/me`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch updates");
      }
      setUpdates(Array.isArray(data?.updates) ? data.updates : []);
    } catch (err) {
      console.error("Fetch daily updates failed", err);
      setError(err instanceof Error ? err.message : "Failed to load updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUpdates();
  }, [apiBase]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please write a short update before posting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch(`${apiBase}/daily-updates`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to post update");
      }
      setMessage("");
      setUpdates((prev) => [data.update, ...prev]);
    } catch (err) {
      console.error("Post daily update failed", err);
      setError(err instanceof Error ? err.message : "Failed to post update.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
          Daily Updates
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Share today’s progress</h1>
        <p className="text-sm text-slate-600">
          Post what you worked on today. A Trello card is created automatically for each update.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="text-sm font-semibold text-slate-700">Today’s update</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Example: Completed UI for login page, fixed API errors, blocked on deployment."
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Be concise. One update per day is ideal.</p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Posting..." : "Post Update"}
          </button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </form>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Your recent updates</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            {updates.length} total
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading updates...
          </div>
        ) : updates.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No updates yet. Post your first one above.
          </div>
        ) : (
          <div className="grid gap-4">
            {updates.map((update) => (
              <article
                key={update._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-700">{update.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {update.createdAt && (
                    <span>
                      {new Date(update.createdAt).toLocaleString("en-GB")}
                    </span>
                  )}
                  {update.trelloCardUrl && (
                    <a
                      href={update.trelloCardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Trello card
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDailyUpdates;
