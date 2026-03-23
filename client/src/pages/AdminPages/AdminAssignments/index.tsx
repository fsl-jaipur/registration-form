import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Link as LinkIcon,
  PenSquare,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/Context/Admincontext";

type Assignment = {
  _id: string;
  title: string;
  videoLink: string;
  thumbnail: string;
  category?: string;
  createdAt: string;
  trelloCardId?: string | null;
  trelloCardUrl?: string | null;
  trelloCardShortUrl?: string | null;
};

type Category = {
  _id: string;
  name: string;
};

const AdminAssignments = (): JSX.Element => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    videoLink: string;
    category: string;
  }>({
    title: "",
    videoLink: "",
    category: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const apiBase = import.meta.env.VITE_API_URL;

  const apiOrigin = useMemo(
    () => apiBase?.replace(/\/api$/, "") ?? "",
    [apiBase],
  );

  const resolveThumbnail = (src: string) =>
    src?.startsWith("http") ? src : `${apiOrigin}${src}`;

  const getTrelloStatus = (assignment: Assignment) =>
    assignment.trelloCardUrl ? "Synced" : "Not synced";

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/assignments`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        const mapped: Assignment[] = (data.assignments ?? []).map((a: any) => ({
          ...a,
          thumbnail: resolveThumbnail(a.thumbnail),
        }));
        setAssignments(mapped);
      } catch (error) {
        console.error(error);
        toast({
          title: "Could not load assignments",
          description: "Please refresh or check your connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [apiBase, toast]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiBase}/categories`);
        const data = await res.json();
        setCategories(
          (data.categories ?? []).map((c: any) => ({
            _id: c._id,
            name: c.name,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, [apiBase]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: "", videoLink: "", category: "" });
  };

  const startEdit = (assignment: Assignment) => {
    resetForm();
    setEditingId(assignment._id);
    setForm({
      title: assignment.title,
      videoLink: assignment.videoLink,
      category: assignment.category || "",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.videoLink.trim()
    ) {
      toast({
        title: "Missing fields",
        description: "Title and video link are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssignmentSubmitting(true);
      const body = JSON.stringify({
        title: form.title.trim(),
        videoLink: form.videoLink.trim(),
        category: form.category.trim(),
      });

      const isEdit = Boolean(editingId);
      const url = isEdit
        ? `${apiBase}/assignments/${editingId}`
        : `${apiBase}/assignments`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save assignment");
      }

      const { assignment } = await res.json();
      const normalized = { ...assignment, thumbnail: resolveThumbnail(assignment.thumbnail) };

      setAssignments((prev) =>
        isEdit
          ? prev.map((a) => (a._id === assignment._id ? normalized : a))
          : [normalized, ...prev],
      );
      resetForm();
      toast({
        title: isEdit ? "Assignment updated" : "Assignment added",
        description: "Ready for student view.",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      const res = await fetch(`${apiBase}/assignments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast({ title: "Assignment deleted" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Delete failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) {
      toast({
        title: "Category name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCategorySubmitting(true);
      const isEdit = Boolean(categoryEditingId);
      const url = isEdit
        ? `${apiBase}/categories/${categoryEditingId}`
        : `${apiBase}/categories`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Category save failed");

      setCategories((prev) => {
        if (isEdit) {
          return prev.map((c) => (c._id === payload.category._id ? payload.category : c));
        }
        return [...prev, payload.category].sort((a, b) => a.name.localeCompare(b.name));
      });
      setCategoryForm({ name: "" });
      setCategoryEditingId(null);
      toast({ title: isEdit ? "Category updated" : "Category created" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Category action failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const startCategoryEdit = (category: Category) => {
    setCategoryEditingId(category._id);
    setCategoryForm({ name: category.name });
  };

  const handleCategoryDelete = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    const toDelete = categories.find((c) => c._id === id);
    try {
      const res = await fetch(`${apiBase}/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || "Delete failed");
      setCategories((prev) => prev.filter((c) => c._id !== id));
      if (categoryEditingId === id) {
        setCategoryEditingId(null);
        setCategoryForm({ name: "" });
      }
      setForm((prev) => ({
        ...prev,
        category: toDelete && prev.category === toDelete.name ? "" : prev.category,
      }));
      toast({ title: "Category deleted" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Delete failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin Control Center</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Assignments Dashboard
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Upload once: title, video link, and category. Thumbnails are generated automatically from YouTube links.
            </p>
          </div>
          {/* <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4 text-brand-orange" />
            Admin-only for now. Student view will be wired next.
          </div> */}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            {/* Thumbnail now auto-generated from video link (YouTube) */}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 shadow-sm focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., React State Management Deep Dive"
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Video Link</label>
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 shadow-sm focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  value={form.videoLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, videoLink: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Hooked to MongoDB via the assignments API. Ready for student panel consumption.
              </p>
              <div className="flex items-center gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-brand-orange hover:text-brand-orange"
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={assignmentSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {assignmentSubmitting ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {assignmentSubmitting
                    ? "Saving..."
                    : editingId
                    ? "Update Assignment"
                    : "Add Assignment"}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">All Assignments</h3>
                <p className="text-xs text-muted-foreground">
                  Stored in the database and fetched dynamically.
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {assignments.length} total
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-[120px] items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No assignments yet. Add one to populate this list.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {assignments.map((item) => (
                  <article
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm transition hover:border-brand-blue/30 hover:shadow-md"
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      {item.thumbnail ? (
                        <img
                          src={resolveThumbnail(item.thumbnail)}
                          alt={`${item.title} thumbnail`}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex min-h-[220px] flex-col gap-3 p-4">
                      <div className="space-y-2">
                        <p className="line-clamp-2 text-base font-semibold leading-snug text-foreground" title={item.title}>
                          {item.title}
                        </p>
                        {item.category && (
                          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-blue ring-1 ring-brand-blue/20">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            item.trelloCardUrl
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {getTrelloStatus(item)}
                        </span>
                        {item.trelloCardUrl && (
                          <a
                            href={item.trelloCardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View in Trello
                          </a>
                        )}
                      </div>

                      <a
                        href={item.videoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1 break-all text-xs text-brand-blue hover:underline"
                      >
                        <ExternalLink className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>{item.videoLink}</span>
                      </a>

                      <div className="mt-auto flex flex-col gap-3 border-t border-border/80 pt-3">
                        <p className="text-[11px] text-muted-foreground">
                          Added {new Date(item.createdAt).toLocaleString()}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-brand-blue shadow-sm transition hover:bg-brand-blue/5"
                            aria-label="Edit assignment"
                          >
                            <PenSquare className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                            aria-label="Delete assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Categories</h3>
              <p className="text-sm text-muted-foreground">
                Create, rename, or remove categories. Updates reflect instantly across admin and student views.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {categories.length} total
            </span>
          </div>

          <form onSubmit={handleCategorySubmit} className="flex flex-wrap gap-3">
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ name: e.target.value })}
              placeholder="e.g., HTML, CSS, React"
              className="min-w-[220px] flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            {categoryEditingId && (
              <button
                type="button"
                onClick={() => {
                  setCategoryEditingId(null);
                  setCategoryForm({ name: "" });
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-brand-orange hover:text-brand-orange"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={categorySubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {categorySubmitting ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {categoryEditingId ? "Update Category" : "Add Category"}
            </button>
          </form>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCategoryEdit(cat)}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10 border border-border shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryDelete(cat._id)}
                    className="rounded-full bg-white/90 p-1 text-red-600 hover:bg-red-50 border border-red-200 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No categories yet. Add one to get started.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAssignments;

