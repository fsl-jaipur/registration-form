import { useEffect, useState } from "react";
import { Play } from "lucide-react";

type Assignment = {
  _id: string;
  title: string;
  videoLink: string;
  thumbnail?: string | null;
  category?: string;
  createdAt?: string;
  trelloCardId?: string | null;
  trelloCardUrl?: string | null;
  trelloCardShortUrl?: string | null;
};

type ActivePlayer = {
  containerId: string;
  embedUrl: string;
} | null;

type Category = {
  _id: string;
  name: string;
};

const getYouTubeEmbedUrl = (videoLink: string, autoplay = false) => {
  try {
    const url = new URL(videoLink);
    const host = url.hostname.replace(/^www\./, "");
    const autoplayQuery = autoplay ? "autoplay=1&rel=0" : "rel=0";
    const playlistId = url.searchParams.get("list");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/playlist" && playlistId) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistId}&${autoplayQuery}`;
      }
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}?${autoplayQuery}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?${autoplayQuery}`;
        }

        if (playlistId) {
          return `https://www.youtube.com/embed/videoseries?list=${playlistId}&${autoplayQuery}`;
        }

        return null;
      }

      if (url.pathname.startsWith("/embed/")) {
        const videoId = url.pathname.split("/embed/")[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}?${autoplayQuery}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

function StudentAssignments() {
  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePlayer, setActivePlayer] = useState<ActivePlayer>(null);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${apiBase}/assignments`, {
          credentials: "include",
        });

        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};

        if (!response.ok) {
          throw new Error(data?.message ?? "Failed to fetch assignments.");
        }

        setAssignments(Array.isArray(data?.assignments) ? data.assignments : []);
      } catch (fetchError) {
        console.error("Failed to fetch assignments", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load assignments. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchAssignments();
  }, [apiBase]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${apiBase}/categories`);
        const data = await res.json();
        if (Array.isArray(data?.categories)) {
          setCategories(
            data.categories.map((c: any) => ({
              _id: c._id,
              name: c.name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    void fetchCategories();
  }, [apiBase]);

  useEffect(() => {
    if (categories.length === 0 && assignments.length > 0) {
      const derived = Array.from(
        new Set(assignments.map((a) => a.category).filter(Boolean)),
      ).map((name, idx) => ({ _id: `derived-${idx}`, name: name as string }));
      setCategories(derived);
    }
  }, [assignments, categories.length]);

  useEffect(() => {
    if (
      selectedCategory !== "All" &&
      !categories.some((c) => c.name === selectedCategory)
    ) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  const playVideo = (videoUrl: string, containerId: string) => {
    const embedUrl = getYouTubeEmbedUrl(videoUrl, true);

    if (!embedUrl) {
      return;
    }

    // Replacing the active player URL automatically stops the previous iframe playback.
    setActivePlayer({
      containerId,
      embedUrl,
    });
  };

  const categoryTabs = ["All", ...Array.from(new Set(categories.map((c) => c.name)))];
  const visibleAssignments =
    selectedCategory === "All"
      ? assignments
      : assignments.filter((a) => (a.category ?? "uncategorized") === selectedCategory);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
          Student Assignments
        </p>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assignments & Videos</h1>
          <p className="mt-2 text-sm text-slate-600">
            Watch the assignment videos and complete your work using the latest instructions shared by your mentor.
          </p>
        </div>
      </div>

      {!loading && !error && assignments.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategory(tab)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                  isActive
                    ? "border-brand-blue bg-brand-blue text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-blue/50 hover:text-brand-blue"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
          <p className="mt-3 text-sm text-slate-600">Loading assignments...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && assignments.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No assignments yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Assignment videos will appear here once they are added from the admin side.
          </p>
        </div>
      )}

      {!loading && !error && assignments.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {visibleAssignments.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
              No assignments in this category yet.
            </div>
          )}
          {visibleAssignments.map((assignment) => {
            const containerId = `assignment-video-${assignment._id}`;
            const previewEmbedUrl =
              activePlayer?.containerId === containerId ? activePlayer.embedUrl : null;
            const canEmbedVideo = Boolean(getYouTubeEmbedUrl(assignment.videoLink));

            return (
              <article
                key={assignment._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {previewEmbedUrl ? (
                    <iframe
                      id={containerId}
                      src={previewEmbedUrl}
                      title={assignment.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : assignment.thumbnail ? (
                    <button
                      type="button"
                      className="group relative h-full w-full"
                      onClick={() => playVideo(assignment.videoLink, containerId)}
                      disabled={!canEmbedVideo}
                    >
                      <img
                        src={assignment.thumbnail}
                        alt={assignment.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
                        <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-slate-800 shadow transition group-hover:scale-105">
                          <Play className="ml-1 h-6 w-6 fill-current" />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div
                      id={containerId}
                      className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-600"
                    >
                      {canEmbedVideo
                        ? "Click Open Video to play this assignment here."
                        : "Preview is not available for this video source."}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-semibold text-slate-900">{assignment.title}</h2>
                  {assignment.category && (
                    <p className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-blue">
                      {assignment.category}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        assignment.trelloCardUrl
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}
                    >
                      {assignment.trelloCardUrl ? "Synced" : "Not synced"}
                    </span>
                    {assignment.trelloCardUrl && (
                      <a
                        href={assignment.trelloCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        View in Trello
                      </a>
                    )}
                  </div>
                  {assignment.createdAt && (
                    <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-500">
                      Added on {new Date(assignment.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  )}
                  
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentAssignments;


