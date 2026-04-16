import { useEffect, useRef, useState } from "react";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  PenLine,
  Plus,
  Trash2,
  Upload,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  adminCreateWorkshop,
  adminDeleteParticipant,
  adminDeleteWorkshop,
  adminListParticipants,
  adminListWorkshops,
  adminUpdateWorkshop,
  adminUploadParticipants,
} from "@/features/workshop/api";
import type { WorkshopData, WorkshopParticipant } from "@/features/workshop/types";
import { useToast } from "@/hooks/use-toast";

const emptyForm = {
  slug: "",
  title: "",
  description: "",
  date: "",
  certificateEnabled: false,
};

type WorkshopForm = typeof emptyForm;

export default function AdminWorkshops() {
  const { toast } = useToast();

  const [workshops, setWorkshops] = useState<WorkshopData[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkshopData | null>(null);
  const [form, setForm] = useState<WorkshopForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Expanded participants panel
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [participantsMap, setParticipantsMap] = useState<
    Record<string, WorkshopParticipant[]>
  >({});
  const [participantsLoading, setParticipantsLoading] = useState<
    Record<string, boolean>
  >({});
  const [uploadLoading, setUploadLoading] = useState<Record<string, boolean>>({});
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ─── Load workshops ─────────────────────────────────────────────────────
  const loadWorkshops = async () => {
    setLoading(true);
    try {
      const data = await adminListWorkshops();
      setWorkshops(data);
    } catch (err) {
      toast({
        title: "Failed to load workshops",
        description: err instanceof Error ? err.message : "Please refresh.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkshops();
  }, []);

  // ─── Open dialog ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (w: WorkshopData) => {
    setEditTarget(w);
    setForm({
      slug: w.slug,
      title: w.title,
      description: w.description,
      date: w.date,
      certificateEnabled: w.certificateEnabled,
    });
    setFormError("");
    setDialogOpen(true);
  };

  // ─── Save workshop ──────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.slug.trim() || !form.title.trim()) {
      setFormError("Slug and title are required.");
      return;
    }

    setFormLoading(true);
    try {
      if (editTarget) {
        const updated = await adminUpdateWorkshop(editTarget._id, {
          title: form.title,
          description: form.description,
          date: form.date,
          certificateEnabled: form.certificateEnabled,
        });
        setWorkshops((prev) =>
          prev.map((w) => (w._id === updated._id ? updated : w))
        );
      } else {
        const created = await adminCreateWorkshop(form);
        setWorkshops((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save workshop."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete workshop ────────────────────────────────────────────────────
  const handleDeleteWorkshop = async (w: WorkshopData) => {
    if (
      !window.confirm(
        `Delete "${w.title}"? This will also remove all participant records.`
      )
    )
      return;

    try {
      await adminDeleteWorkshop(w._id);
      setWorkshops((prev) => prev.filter((x) => x._id !== w._id));
      if (expandedId === w._id) setExpandedId(null);
      toast({ title: "Workshop deleted" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ─── Quick certificate toggle ────────────────────────────────────────────
  const handleToggleCertificate = async (w: WorkshopData) => {
    try {
      const updated = await adminUpdateWorkshop(w._id, {
        certificateEnabled: !w.certificateEnabled,
      });
      setWorkshops((prev) =>
        prev.map((x) => (x._id === updated._id ? updated : x))
      );
      toast({
        title: updated.certificateEnabled
          ? "Certificate download enabled"
          : "Certificate download disabled",
      });
    } catch (err) {
      toast({
        title: "Toggle failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ─── Load participants ───────────────────────────────────────────────────
  const loadParticipants = async (workshopId: string) => {
    setParticipantsLoading((prev) => ({ ...prev, [workshopId]: true }));
    try {
      const data = await adminListParticipants(workshopId);
      setParticipantsMap((prev) => ({ ...prev, [workshopId]: data }));
    } catch (err) {
      toast({
        title: "Failed to load participants",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setParticipantsLoading((prev) => ({ ...prev, [workshopId]: false }));
    }
  };

  const toggleParticipants = (workshopId: string) => {
    if (expandedId === workshopId) {
      setExpandedId(null);
    } else {
      setExpandedId(workshopId);
      if (!participantsMap[workshopId]) {
        void loadParticipants(workshopId);
      }
    }
  };

  // ─── CSV upload ──────────────────────────────────────────────────────────
  const handleCsvUpload = async (workshopId: string, file: File) => {
    setUploadLoading((prev) => ({ ...prev, [workshopId]: true }));
    try {
      const result = await adminUploadParticipants(workshopId, file);
      toast({
        title: "Upload complete",
        description: `${result.inserted} inserted, ${result.skipped} skipped.`,
      });
      // Reload participants list
      await loadParticipants(workshopId);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadLoading((prev) => ({ ...prev, [workshopId]: false }));
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  // ─── Delete participant ──────────────────────────────────────────────────
  const handleDeleteParticipant = async (
    workshopId: string,
    participantId: string
  ) => {
    if (!window.confirm("Remove this participant?")) return;

    try {
      await adminDeleteParticipant(workshopId, participantId);
      setParticipantsMap((prev) => ({
        ...prev,
        [workshopId]: (prev[workshopId] || []).filter(
          (p) => p._id !== participantId
        ),
      }));
      toast({ title: "Participant removed" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Workshops</h1>
              <p className="text-sm text-slate-500">
                Manage workshop pages, participants, and certificates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Workshop
          </button>
        </div>

        {/* Workshop list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : workshops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No workshops yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Create a workshop to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workshops.map((w) => (
              <div
                key={w._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Workshop row */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-slate-900 truncate">
                        {w.title}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">
                        /workshop/{w.slug}
                      </span>
                    </div>
                    {w.date && (
                      <p className="mt-0.5 text-sm text-slate-500">{w.date}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {/* Certificate toggle */}
                    <button
                      type="button"
                      onClick={() => void handleToggleCertificate(w)}
                      title={
                        w.certificateEnabled
                          ? "Disable certificate download"
                          : "Enable certificate download"
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        w.certificateEnabled
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {w.certificateEnabled ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                      {w.certificateEnabled ? "Cert ON" : "Cert OFF"}
                    </button>

                    {/* Participants */}
                    <button
                      type="button"
                      onClick={() => toggleParticipants(w._id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <Users className="h-4 w-4" />
                      Participants
                      {expandedId === w._id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEdit(w)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <PenLine className="h-4 w-4" />
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => void handleDeleteWorkshop(w)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Participants panel */}
                {expandedId === w._id && (
                  <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
                    <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Participants
                        {participantsMap[w._id] != null
                          ? ` (${participantsMap[w._id].length})`
                          : ""}
                      </h3>

                      <div className="flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
                          {uploadLoading[w._id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Upload CSV
                          <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void handleCsvUpload(w._id, file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void loadParticipants(w._id)}
                          className="rounded-xl bg-white border border-slate-200 p-1.5 text-slate-500 shadow-sm transition hover:bg-slate-50"
                          title="Refresh"
                        >
                          <Download className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    </div>

                    <p className="mb-3 text-xs text-slate-400">
                      CSV format: <code>enrollmentId,email,name</code> (header row
                      required)
                    </p>

                    {participantsLoading[w._id] ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    ) : !participantsMap[w._id]?.length ? (
                      <p className="py-6 text-center text-sm text-slate-400">
                        No participants yet. Upload a CSV to add them.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3">Enrollment ID</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {participantsMap[w._id].map((p, idx) => (
                              <tr
                                key={p._id}
                                className={`border-b border-slate-50 ${
                                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                }`}
                              >
                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {p.name}
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                  {p.email}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-500">
                                  {p.enrollmentId}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeleteParticipant(w._id, p._id)
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold">
              {editTarget ? "Edit Workshop" : "New Workshop"}
            </h2>

            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Slug{" "}
                  <span className="text-xs text-slate-400">(URL identifier — immutable after creation)</span>
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                  placeholder="agent-api"
                  disabled={Boolean(editTarget)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Agent API Workshop"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus={!editTarget}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Date</span>
                <input
                  type="text"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  placeholder="April 16, 2026"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  value={form.description}
                  rows={4}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe what this workshop covers…"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      certificateEnabled: !f.certificateEnabled,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    form.certificateEnabled ? "bg-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                      form.certificateEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium">
                  Enable certificate download
                </span>
              </label>

              {formError && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editTarget ? "Save Changes" : "Create Workshop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
