import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminContext } from "@/Context/Admincontext";
import { useToast } from "@/hooks/use-toast";
import {
  CAREER_QUERY_KEY,
  fallbackCareerSection,
  fetchCareerSection,
  normalizeCareerList,
  type CareerHighlightCard,
  type CareerOpening,
  type CareerSectionData,
} from "@/lib/api/career";

type ListFieldKey = "benefits" | "hiringSteps";
type ListEditorState = { field: ListFieldKey; index: number } | null;

const emptyHighlightCard = (): CareerHighlightCard => ({
  title: "",
  description: "",
  icon: "BriefcaseBusiness",
  accent: "brand-blue",
});

const emptyOpening = (): CareerOpening => ({
  title: "",
  type: "Full Time",
  location: "",
  summary: "",
});

const accentOptions = ["brand-blue", "brand-orange"] as const;
const iconOptions = ["BriefcaseBusiness", "Users", "Clock3", "Sparkles", "MapPin"] as const;

export default function AdminCareer() {
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [form, setForm] = useState<CareerSectionData>(fallbackCareerSection);
  const [benefitsDraft, setBenefitsDraft] = useState("");
  const [stepsDraft, setStepsDraft] = useState("");
  const [editingListItem, setEditingListItem] = useState<ListEditorState>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, navigate, role]);

  const load = async () => {
    if (!apiBase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchCareerSection();
      setForm(data);
      setSectionId(data._id || null);
      queryClient.setQueryData(CAREER_QUERY_KEY, data);
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to load career page content", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const updateField = <K extends keyof CareerSectionData>(field: K, value: CareerSectionData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateHighlightCard = (index: number, next: Partial<CareerHighlightCard>) =>
    setForm((prev) => ({
      ...prev,
      highlightCards: prev.highlightCards.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item,
      ),
    }));

  const updateOpening = (index: number, next: Partial<CareerOpening>) =>
    setForm((prev) => ({
      ...prev,
      openings: prev.openings.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item,
      ),
    }));

  const addListItems = (field: ListFieldKey) => {
    const draftValue = field === "benefits" ? benefitsDraft : stepsDraft;
    const newItems = normalizeCareerList(draftValue);
    if (!newItems.length) return;

    const current = field === "benefits" ? form.benefits : form.hiringSteps;
    const seen = new Set(current.map((item) => item.toLowerCase()));
    const merged = [...current, ...newItems.filter((item) => !seen.has(item.toLowerCase()))];

    updateField(field, merged);
    if (field === "benefits") setBenefitsDraft("");
    if (field === "hiringSteps") setStepsDraft("");
  };

  const startEditListItem = (field: ListFieldKey, index: number) => {
    const source = field === "benefits" ? form.benefits : form.hiringSteps;
    setEditingListItem({ field, index });
    setEditingValue(source[index] || "");
  };

  const saveListItem = () => {
    if (!editingListItem) return;
    const nextValue = editingValue.trim();
    if (!nextValue) return;

    const source = editingListItem.field === "benefits" ? form.benefits : form.hiringSteps;
    const updated = source.map((item, index) => (index === editingListItem.index ? nextValue : item));
    updateField(editingListItem.field, normalizeCareerList(updated));
    setEditingListItem(null);
    setEditingValue("");
  };

  const removeListItem = (field: ListFieldKey, index: number) => {
    const source = field === "benefits" ? form.benefits : form.hiringSteps;
    updateField(
      field,
      source.filter((_, itemIndex) => itemIndex !== index),
    );
    if (editingListItem?.field === field && editingListItem.index === index) {
      setEditingListItem(null);
      setEditingValue("");
    }
  };

  const handleSave = async () => {
    if (!apiBase) return;

    try {
      setSaving(true);

      const payload = {
        ...form,
        benefits: normalizeCareerList(form.benefits),
        hiringSteps: normalizeCareerList(form.hiringSteps),
        highlightCards: form.highlightCards.map((item, index) => ({ ...item, order: index })),
        openings: form.openings.map((item, index) => ({ ...item, order: index })),
      };

      const url = sectionId ? `${apiBase}/career-section/${sectionId}` : `${apiBase}/career-section`;
      const method = sectionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save career section");
      }

      const data = await fetchCareerSection();
      setForm(data);
      setSectionId(data._id || null);
      queryClient.setQueryData(CAREER_QUERY_KEY, data);
      toast({ title: "Career page saved" });
    } catch (error) {
      console.error(error);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const listSections = [
    {
      key: "benefits" as const,
      title: "Benefits",
      headingField: "benefitsTitle" as const,
      headingValue: form.benefitsTitle,
      items: form.benefits,
      draft: benefitsDraft,
      setDraft: setBenefitsDraft,
    },
    {
      key: "hiringSteps" as const,
      title: "Hiring Steps",
      headingField: "hiringStepsTitle" as const,
      headingValue: form.hiringStepsTitle,
      items: form.hiringSteps,
      draft: stepsDraft,
      setDraft: setStepsDraft,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto space-y-8 px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin / Career Page</p>
            <h1 className="bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-3xl font-bold leading-tight text-transparent">
              Career Page
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Edit the public career page content, including hero copy, role cards, benefit lists, hiring steps, and CTA details.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand-blue hover:text-brand-blue disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <section className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="rounded-lg border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 text-sm text-muted-foreground">
            Changes here update the public `/career` page. The application form submission endpoint stays the same.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Hero Badge</span>
              <input value={form.heroBadge} onChange={(e) => updateField("heroBadge", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Hero Highlight</span>
              <input value={form.heroHighlight} onChange={(e) => updateField("heroHighlight", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            <span>Hero Title</span>
            <input value={form.heroTitle} onChange={(e) => updateField("heroTitle", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </label>

          <label className="space-y-2 text-sm font-medium">
            <span>Hero Description</span>
            <textarea rows={3} value={form.heroDescription} onChange={(e) => updateField("heroDescription", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Apply Button Label</span>
              <input value={form.applyButtonLabel} onChange={(e) => updateField("applyButtonLabel", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Roles Button Label</span>
              <input value={form.rolesButtonLabel} onChange={(e) => updateField("rolesButtonLabel", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>
        </section>

        <section className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Highlight Cards</h2>
              <p className="text-sm text-muted-foreground">These cards appear beside the hero section.</p>
            </div>
            <button type="button" onClick={() => updateField("highlightCards", [...form.highlightCards, emptyHighlightCard()])} className="inline-flex items-center gap-2 rounded-lg border border-brand-blue px-3 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white">
              <Plus className="h-4 w-4" />
              Add Card
            </button>
          </div>

          <div className="space-y-4">
            {form.highlightCards.map((card, index) => (
              <div key={card._id || `card-${index}`} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Card {index + 1}</span>
                  <button type="button" onClick={() => updateField("highlightCards", form.highlightCards.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    <span>Title</span>
                    <input value={card.title} onChange={(e) => updateHighlightCard(index, { title: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Icon</span>
                    <select value={card.icon} onChange={(e) => updateHighlightCard(index, { icon: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
                      {iconOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    <span>Accent</span>
                    <select value={card.accent} onChange={(e) => updateHighlightCard(index, { accent: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
                      {accentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <label className="mt-4 block space-y-2 text-sm font-medium">
                  <span>Description</span>
                  <textarea rows={3} value={card.description} onChange={(e) => updateHighlightCard(index, { description: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              <span>Role Section Badge</span>
              <input value={form.roleSectionBadge} onChange={(e) => updateField("roleSectionBadge", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium md:col-span-2">
              <span>Role Section Title</span>
              <input value={form.roleSectionTitle} onChange={(e) => updateField("roleSectionTitle", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            <span>Role Section Description</span>
            <textarea rows={2} value={form.roleSectionDescription} onChange={(e) => updateField("roleSectionDescription", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </label>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Open Roles</h2>
              <p className="text-sm text-muted-foreground">Manage the role cards shown to visitors.</p>
            </div>
            <button type="button" onClick={() => updateField("openings", [...form.openings, emptyOpening()])} className="inline-flex items-center gap-2 rounded-lg border border-brand-blue px-3 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white">
              <Plus className="h-4 w-4" />
              Add Role
            </button>
          </div>

          <div className="space-y-4">
            {form.openings.map((opening, index) => (
              <div key={opening._id || `opening-${index}`} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Role {index + 1}</span>
                  <button type="button" onClick={() => updateField("openings", form.openings.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    <span>Title</span>
                    <input value={opening.title} onChange={(e) => updateOpening(index, { title: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    <span>Employment Type</span>
                    <input value={opening.type} onChange={(e) => updateOpening(index, { type: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  </label>
                </div>

                <label className="mt-4 block space-y-2 text-sm font-medium">
                  <span>Location</span>
                  <input value={opening.location} onChange={(e) => updateOpening(index, { location: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                </label>

                <label className="mt-4 block space-y-2 text-sm font-medium">
                  <span>Summary</span>
                  <textarea rows={3} value={opening.summary} onChange={(e) => updateOpening(index, { summary: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {listSections.map((section) => (
            <div key={section.key} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <label className="space-y-2 text-sm font-medium">
                <span>{section.title} Title</span>
                <input value={section.headingValue} onChange={(e) => updateField(section.headingField, e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
              </label>

              <textarea rows={3} value={section.draft} onChange={(e) => section.setDraft(e.target.value)} placeholder={`Add ${section.title.toLowerCase()} here, one per line`} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />

              <button type="button" onClick={() => addListItems(section.key)} className="inline-flex items-center gap-2 rounded-lg border border-brand-blue px-3 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white">
                <Plus className="h-4 w-4" />
                Add {section.title}
              </button>

              <div className="space-y-2">
                {section.items.map((item, index) => {
                  const isEditing = editingListItem?.field === section.key && editingListItem.index === index;

                  return (
                    <div key={`${section.key}-${index}`} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
                      {isEditing ? (
                        <>
                          <input value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full rounded-lg border border-brand-blue px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={saveListItem} className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                              <Check className="h-4 w-4" />
                              Update
                            </button>
                            <button type="button" onClick={() => { setEditingListItem(null); setEditingValue(""); }} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand-blue hover:text-brand-blue">
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-foreground">{item}</p>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => startEditListItem(section.key, index)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-brand-blue hover:text-brand-blue">
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button type="button" onClick={() => removeListItem(section.key, index)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">CTA and Application Modal</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>CTA Eyebrow</span>
              <input value={form.ctaEyebrow} onChange={(e) => updateField("ctaEyebrow", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>CTA Title</span>
              <input value={form.ctaTitle} onChange={(e) => updateField("ctaTitle", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            <span>CTA Description</span>
            <textarea rows={3} value={form.ctaDescription} onChange={(e) => updateField("ctaDescription", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Email Button Label</span>
              <input value={form.ctaEmailLabel} onChange={(e) => updateField("ctaEmailLabel", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Email Address</span>
              <input value={form.ctaEmailAddress} onChange={(e) => updateField("ctaEmailAddress", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Email Subject</span>
              <input value={form.ctaEmailSubject} onChange={(e) => updateField("ctaEmailSubject", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Phone Button Label</span>
              <input value={form.ctaPhoneLabel} onChange={(e) => updateField("ctaPhoneLabel", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Email Body</span>
              <textarea rows={3} value={form.ctaEmailBody} onChange={(e) => updateField("ctaEmailBody", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Phone Number</span>
              <input value={form.ctaPhoneNumber} onChange={(e) => updateField("ctaPhoneNumber", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Modal Title</span>
              <input value={form.modalTitle} onChange={(e) => updateField("modalTitle", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Modal Description</span>
              <input value={form.modalDescription} onChange={(e) => updateField("modalDescription", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium md:col-span-2">
              <span>Resume Helper Text</span>
              <input value={form.resumeHelperText} onChange={(e) => updateField("resumeHelperText", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Submit Button Label</span>
              <input value={form.submitButtonLabel} onChange={(e) => updateField("submitButtonLabel", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
            </label>
          </div>

          <label className="block max-w-sm space-y-2 text-sm font-medium">
            <span>Cancel Button Label</span>
            <input value={form.cancelButtonLabel} onChange={(e) => updateField("cancelButtonLabel", e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
          </label>

          <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:opacity-70">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Career Page"}
          </button>
        </section>
      </main>
    </div>
  );
}
