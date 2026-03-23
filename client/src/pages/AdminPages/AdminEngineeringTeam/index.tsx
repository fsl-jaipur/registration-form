import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useAdminContext } from "@/Context/Admincontext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  ENGINEERING_TEAM_QUERY_KEY,
  fallbackEngineeringTeam,
  type EngineeringMember,
  fetchEngineeringTeam,
} from "@/lib/api/engineeringTeam";
import { parseOptionalNumber, toNumberInputValue } from "@/lib/utils";

const emptyMember = (): EngineeringMember => ({
  name: "",
  title: "",
  photo: "",
  order: undefined,
});

export default function AdminEngineeringTeam() {
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<EngineeringMember[]>(fallbackEngineeringTeam);
  const [draft, setDraft] = useState<EngineeringMember>(emptyMember());
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  const load = async () => {
    if (!apiBase) {
      setMembers(fallbackEngineeringTeam);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/engineering-team`);
      if (!res.ok) throw new Error("Failed to fetch team");
      const data = await res.json();
      setMembers(data?.team || fallbackEngineeringTeam);
      queryClient.setQueryData(ENGINEERING_TEAM_QUERY_KEY, data?.team || fallbackEngineeringTeam);
      setPhotoFile(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to load team", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const handleSave = async () => {
    if (!apiBase) return;
    const hasPhoto = photoFile || draft.photo.trim();
    if (!draft.name.trim() || !draft.title.trim() || !hasPhoto) {
      toast({ title: "Name, title, and a photo are required", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const form = new FormData();
      form.append("name", draft.name);
      form.append("title", draft.title);
      if (photoFile) {
        form.append("photo", photoFile);
      } else {
        form.append("photo", draft.photo);
      }
      form.append("order", draft.order === undefined ? "" : String(draft.order));
      if (draft._id) {
        const res = await fetch(`${apiBase}/engineering-team/${draft._id}`, {
          method: "PUT",
          body: form,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to update member");
      } else {
        const res = await fetch(`${apiBase}/engineering-team`, {
          method: "POST",
          body: form,
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to create member");
      }
      setDraft(emptyMember());
      setPhotoFile(null);
      await load();
      toast({ title: "Saved" });
    } catch (error) {
      console.error(error);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: EngineeringMember) => setDraft(member);

  const handleDelete = async (id?: string) => {
    if (!apiBase || !id) return;
    try {
      const res = await fetch(`${apiBase}/engineering-team/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
      await load();
      toast({ title: "Member deleted" });
    } catch (error) {
      console.error(error);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const title = draft._id ? "Update Member" : "Add New Member";
  const previewPhoto = photoFile ? URL.createObjectURL(photoFile) : draft.photo;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin / Engineering Team</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Engineering Team
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Manage team members shown on the Engineering Team section.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-brand-blue hover:text-brand-blue disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">Name, title, photo URL, and order.</p>
            </div>
            <button
              type="button"
              onClick={() => setDraft(emptyMember())}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-brand-blue hover:text-brand-blue"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Photo</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="w-32 h-32 rounded-lg border border-border bg-muted/40 overflow-hidden">
                  {previewPhoto ? (
                    <img src={previewPhoto} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setPhotoFile(file);
                    }}
                    className="block w-full text-sm text-foreground file:mr-4 file:rounded-md file:border file:border-border file:bg-muted/60 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:bg-muted focus:outline-none"
                  />
                  {!photoFile && (
                    <input
                      value={draft.photo}
                      onChange={(e) => setDraft({ ...draft, photo: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="https://... (optional if uploading)"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Order</label>
              <input
                type="number"
                value={toNumberInputValue(draft.order)}
                onChange={(e) => setDraft({ ...draft, order: parseOptionalNumber(e.target.value) })}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <span className="text-xs text-muted-foreground">{members.length} total</span>
          </div>

          {members.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
              No team members yet.
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <div
                key={member._id || member.name}
                className="rounded-lg border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex gap-4"
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-20 w-20 rounded-lg object-cover border border-border"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(member._id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Order: {member.order ?? 0}</span>
                    <button
                      type="button"
                      className="text-brand-blue hover:underline"
                      onClick={() => handleEdit(member)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
