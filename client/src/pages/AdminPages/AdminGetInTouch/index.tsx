import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useAdminContext } from "@/Context/Admincontext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  GET_IN_TOUCH_QUERY_KEY,
  fallbackGetInTouch,
  fetchGetInTouch,
  normalizeGetInTouchList,
  type GetInTouchData,
} from "@/lib/api/getInTouch";

type ListFieldKey = "courses" | "highlights";
type ListErrors = Partial<Record<ListFieldKey, string>>;
type EditingItem = { field: ListFieldKey; index: number } | null;

const emptyListDrafts: Record<ListFieldKey, string> = {
  courses: "",
  highlights: "",
};

const fieldLabels: Record<ListFieldKey, string> = {
  courses: "Courses",
  highlights: "Highlights",
};

const fieldPlaceholders: Record<ListFieldKey, string> = {
  courses: "Paste one or more courses, one per line",
  highlights: "Paste one or more highlights, one per line",
};

type ListEditorProps = {
  title: string;
  description: string;
  items: string[];
  draftValue: string;
  placeholder: string;
  error?: string;
  editingIndex: number | null;
  editingValue: string;
  onDraftChange: (value: string) => void;
  onAddItems: () => void;
  onStartEdit: (index: number) => void;
  onDeleteItem: (index: number) => void;
  onEditingValueChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
};

const ListEditor = ({
  title,
  description,
  items,
  draftValue,
  placeholder,
  error,
  editingIndex,
  editingValue,
  onDraftChange,
  onAddItems,
  onStartEdit,
  onDeleteItem,
  onEditingValueChange,
  onSaveEdit,
  onCancelEdit,
}: ListEditorProps) => (
  <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">{title}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
        {items.length} item{items.length === 1 ? "" : "s"}
      </span>
    </div>

    <div className="space-y-3 rounded-lg border border-dashed border-border bg-white/80 p-3">
      <textarea
        value={draftValue}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            onAddItems();
          }
        }}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Each line becomes a separate entry. Empty lines and duplicates are ignored.
        </p>
        <button
          type="button"
          onClick={onAddItems}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-blue px-3 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>

    {items.length === 0 ? (
      <div className="rounded-lg border border-dashed border-border bg-white/70 px-4 py-6 text-sm text-muted-foreground">
        No entries yet. Add items above to build this list.
      </div>
    ) : (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3 shadow-sm sm:flex-row sm:items-center"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue">
              {index + 1}
            </span>

            {editingIndex === index ? (
              <>
                <input
                  value={editingValue}
                  onChange={(event) => onEditingValueChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSaveEdit();
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      onCancelEdit();
                    }
                  }}
                  autoFocus
                  className="flex-1 rounded-lg border border-brand-blue px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={onSaveEdit}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Check className="h-4 w-4" />
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand-blue hover:text-brand-blue"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">{item}</p>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onStartEdit(index)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand-blue hover:text-brand-blue"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(index)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default function AdminGetInTouch() {
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
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [form, setForm] = useState<GetInTouchData>(fallbackGetInTouch);
  const [listDrafts, setListDrafts] = useState<Record<ListFieldKey, string>>(emptyListDrafts);
  const [listErrors, setListErrors] = useState<ListErrors>({});
  const [editingItem, setEditingItem] = useState<EditingItem>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  const resetListUi = () => {
    setListDrafts(emptyListDrafts);
    setListErrors({});
    setEditingItem(null);
    setEditingValue("");
  };

  const updateListField = (field: ListFieldKey, items: string[]) => {
    const cleanedItems = normalizeGetInTouchList(items);

    setForm((prev) =>
      field === "courses"
        ? { ...prev, courses: cleanedItems }
        : { ...prev, highlights: cleanedItems },
    );
  };

  const getItemsForField = (field: ListFieldKey) =>
    field === "courses" ? form.courses : form.highlights;

  const setFieldError = (field: ListFieldKey, message?: string) =>
    setListErrors((prev) => ({ ...prev, [field]: message }));

  const load = async () => {
    if (!apiBase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchGetInTouch();
      setForm(data);
      setSectionId(data._id || null);
      resetListUi();
      queryClient.setQueryData(GET_IN_TOUCH_QUERY_KEY, data);
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to load Get In Touch content", variant: "destructive" });
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

    if (editingItem) {
      toast({
        title: `Finish editing ${fieldLabels[editingItem.field].toLowerCase()} before saving`,
        variant: "destructive",
      });
      return;
    }

    const courses = normalizeGetInTouchList(form.courses);
    const highlights = normalizeGetInTouchList(form.highlights);

    if (!courses.length) {
      setFieldError("courses", "Add at least one course before saving.");
      toast({ title: "At least one course is required", variant: "destructive" });
      return;
    }

    setFieldError("courses");
    setFieldError("highlights");

    try {
      setSaving(true);
      const body = {
        ...form,
        courses,
        highlights,
      };
      const url = sectionId ? `${apiBase}/get-in-touch/${sectionId}` : `${apiBase}/get-in-touch`;
      const method = sectionId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save");
      }
      const data = await fetchGetInTouch();
      setForm(data);
      setSectionId(data._id || null);
      resetListUi();
      queryClient.setQueryData(GET_IN_TOUCH_QUERY_KEY, data);
      toast({ title: "Get In Touch saved" });
    } catch (error) {
      console.error(error);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof GetInTouchData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addItems = (field: ListFieldKey) => {
    const parsedItems = normalizeGetInTouchList(listDrafts[field]);

    if (!parsedItems.length) {
      setFieldError(field, `Enter at least one valid ${fieldLabels[field].slice(0, -1).toLowerCase()}.`);
      return;
    }

    const currentItems = getItemsForField(field);
    const existingItems = new Set(currentItems.map((item) => item.toLowerCase()));
    const newItems = parsedItems.filter((item) => !existingItems.has(item.toLowerCase()));

    if (!newItems.length) {
      setFieldError(field, "All of those items already exist in the list.");
      return;
    }

    updateListField(field, [...currentItems, ...newItems]);
    setListDrafts((prev) => ({ ...prev, [field]: "" }));
    setFieldError(field, undefined);
  };

  const startEditingItem = (field: ListFieldKey, index: number) => {
    setEditingItem({ field, index });
    setEditingValue(getItemsForField(field)[index] || "");
    setFieldError(field, undefined);
  };

  const cancelEditingItem = () => {
    setEditingItem(null);
    setEditingValue("");
  };

  const saveEditingItem = () => {
    if (!editingItem) return;

    const nextValue = editingValue.trim();
    if (!nextValue) {
      setFieldError(editingItem.field, "Edited value cannot be empty.");
      return;
    }

    const currentItems = getItemsForField(editingItem.field);
    const duplicateItem = currentItems.find(
      (item, index) =>
        index !== editingItem.index && item.toLowerCase() === nextValue.toLowerCase(),
    );

    if (duplicateItem) {
      setFieldError(editingItem.field, `"${nextValue}" is already in the list.`);
      return;
    }

    updateListField(
      editingItem.field,
      currentItems.map((item, index) => (index === editingItem.index ? nextValue : item)),
    );
    setFieldError(editingItem.field, undefined);
    cancelEditingItem();
  };

  const deleteItem = (field: ListFieldKey, index: number) => {
    updateListField(
      field,
      getItemsForField(field).filter((_, itemIndex) => itemIndex !== index),
    );

    if (editingItem?.field === field) {
      cancelEditingItem();
    }

    setFieldError(field, undefined);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin / Get In Touch</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Get In Touch
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Manage the contact section content shown on the public site.
            </p>
          </div>
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

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm text-muted-foreground">
            Manage the public enquiry form content here. Courses and highlights are stored as arrays, and each entry can be added, edited, or removed independently.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Badge Text</label>
              <input
                value={form.badgeText}
                onChange={(e) => updateField("badgeText", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Heading</label>
              <input
                value={form.heading}
                onChange={(e) => updateField("heading", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Highlight</label>
              <input
                value={form.highlight}
                onChange={(e) => updateField("highlight", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Map Link</label>
              <input
                value={form.mapLink}
                onChange={(e) => updateField("mapLink", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ListEditor
              title="Courses"
              description="Paste one or many courses, one per line, then add them to the list."
              items={form.courses}
              draftValue={listDrafts.courses}
              placeholder={fieldPlaceholders.courses}
              error={listErrors.courses}
              editingIndex={editingItem?.field === "courses" ? editingItem.index : null}
              editingValue={editingItem?.field === "courses" ? editingValue : ""}
              onDraftChange={(value) => setListDrafts((prev) => ({ ...prev, courses: value }))}
              onAddItems={() => addItems("courses")}
              onStartEdit={(index) => startEditingItem("courses", index)}
              onDeleteItem={(index) => deleteItem("courses", index)}
              onEditingValueChange={setEditingValue}
              onSaveEdit={saveEditingItem}
              onCancelEdit={cancelEditingItem}
            />
            <ListEditor
              title="Highlights"
              description="Add benefit points for the public enquiry section. Each line becomes a separate highlight."
              items={form.highlights}
              draftValue={listDrafts.highlights}
              placeholder={fieldPlaceholders.highlights}
              error={listErrors.highlights}
              editingIndex={editingItem?.field === "highlights" ? editingItem.index : null}
              editingValue={editingItem?.field === "highlights" ? editingValue : ""}
              onDraftChange={(value) => setListDrafts((prev) => ({ ...prev, highlights: value }))}
              onAddItems={() => addItems("highlights")}
              onStartEdit={(index) => startEditingItem("highlights", index)}
              onDeleteItem={(index) => deleteItem("highlights", index)}
              onEditingValueChange={setEditingValue}
              onSaveEdit={saveEditingItem}
              onCancelEdit={cancelEditingItem}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Form Endpoint</label>
              <input
                value={form.formEndpoint}
                onChange={(e) => updateField("formEndpoint", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Access Key</label>
              <input
                value={form.accessKey}
                onChange={(e) => updateField("accessKey", e.target.value)}
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
      </main>
    </div>
  );
}
