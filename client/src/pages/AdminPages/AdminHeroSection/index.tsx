import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/Context/Admincontext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  broadcastHeroUpdate,
  HERO_QUERY_KEY,
  normalizeHeroSection,
  type HeroSectionData,
} from "@/lib/api/heroSection";
import { parseOptionalNumber, toNumberInputValue } from "@/lib/utils";

type HeroButton = {
  _id?: string;
  label: string;
  href: string;
  style: "primary" | "secondary" | "outline" | "ghost";
  icon: string;
  order?: number;
  isExternal: boolean;
};

type HeroStat = {
  _id?: string;
  label: string;
  value?: number;
  suffix: string;
  icon: string;
  order?: number;
};

type HeroImage = {
  _id?: string;
  url: string;
  alt: string;
  order?: number;
};

const emptyButton = (): HeroButton => ({
  label: "",
  href: "",
  style: "primary",
  icon: "",
  order: undefined,
  isExternal: false,
});

const emptyStat = (): HeroStat => ({
  label: "",
  value: undefined,
  suffix: "",
  icon: "",
  order: undefined,
});

const emptyImage = (): HeroImage => ({
  url: "",
  alt: "",
  order: undefined,
});

const AdminHeroSection = () => {
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
  const [heroId, setHeroId] = useState<string | null>(null);

  const [badgeText, setBadgeText] = useState("");
  const [title, setTitle] = useState("");
  const [highlightPrefix, setHighlightPrefix] = useState("");
  const [highlightNumber, setHighlightNumber] = useState<number | undefined>(undefined);
  const [highlightSuffix, setHighlightSuffix] = useState("");
  const [description, setDescription] = useState("");
  const [scrollText, setScrollText] = useState("Scroll");
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const [animatedWords, setAnimatedWords] = useState<string[]>([]);
  const [buttons, setButtons] = useState<HeroButton[]>([]);
  const [stats, setStats] = useState<HeroStat[]>([]);
  const [images, setImages] = useState<HeroImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  const fetchHero = async () => {
    if (!apiBase) {
      toast({
        title: "Missing API base URL",
        description: "Set VITE_API_URL in your environment and reload.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/hero-section`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch hero section");
      const data = await res.json();
      const hero = normalizeHeroSection(data.hero) as HeroSectionData;
      setHeroId(hero._id || null);
      setBadgeText(hero.badgeText || "");
      setTitle(hero.title || "");
      setHighlightPrefix(hero.highlightPrefix || "");
      setHighlightNumber(parseOptionalNumber(hero.highlightNumber));
      setHighlightSuffix(hero.highlightSuffix || "");
      setDescription(hero.description || "");
      setScrollText(hero.scrollText || "Scroll");
      setShowScrollIndicator(Boolean(hero.showScrollIndicator));
      setAnimatedWords(hero.animatedWords || []);
      setButtons(hero.buttons || []);
      setStats(hero.stats || []);
      setImages(hero.images || []);
      setNewImages([]);
      queryClient.setQueryData(HERO_QUERY_KEY, hero);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to load hero section",
        description: "Refresh or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiBase) fetchHero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const handleSave = async () => {
    if (!apiBase) {
      toast({ title: "Missing API base URL", variant: "destructive" });
      return;
    }

    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    if (highlightNumber === undefined) {
      toast({ title: "Highlight number is required", variant: "destructive" });
      return;
    }

    if (stats.some((stat) => stat.value === undefined || Number.isNaN(stat.value))) {
      toast({ title: "Each stat needs a numeric value", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const body = new FormData();
      body.append("badgeText", badgeText);
      body.append("title", title);
      body.append("highlightPrefix", highlightPrefix);
      body.append("highlightNumber", String(highlightNumber));
      body.append("highlightSuffix", highlightSuffix);
      body.append("description", description);
      body.append("scrollText", scrollText);
      body.append("showScrollIndicator", String(showScrollIndicator));
      body.append("animatedWords", JSON.stringify(animatedWords));
      body.append("buttons", JSON.stringify(buttons));
      body.append("stats", JSON.stringify(stats));
      body.append("images", JSON.stringify(images));
      newImages.forEach((file) => body.append("images", file));

      const url = heroId
        ? `${apiBase}/hero-section/${heroId}`
        : `${apiBase}/hero-section`;
      const method = heroId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save hero section");
      }

      const data = await res.json();
      const hero = normalizeHeroSection(data.hero) as HeroSectionData;
      setHeroId(hero._id || null);
      setBadgeText(hero.badgeText || "");
      setTitle(hero.title || "");
      setHighlightPrefix(hero.highlightPrefix || "");
      setHighlightNumber(parseOptionalNumber(hero.highlightNumber));
      setHighlightSuffix(hero.highlightSuffix || "");
      setDescription(hero.description || "");
      setScrollText(hero.scrollText || "Scroll");
      setShowScrollIndicator(Boolean(hero.showScrollIndicator));
      setAnimatedWords(hero.animatedWords || []);
      setButtons(hero.buttons || []);
      setStats(hero.stats || []);
      setImages(hero.images || []);
      setNewImages([]);
      queryClient.setQueryData(HERO_QUERY_KEY, hero);
      void queryClient.invalidateQueries({ queryKey: HERO_QUERY_KEY });
      broadcastHeroUpdate();

      toast({ title: "Hero section saved" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateButton = (index: number, patch: Partial<HeroButton>) => {
    setButtons((prev) => prev.map((btn, i) => (i === index ? { ...btn, ...patch } : btn)));
  };

  const updateStat = (index: number, patch: Partial<HeroStat>) => {
    setStats((prev) => prev.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)));
  };

  const updateImage = (index: number, patch: Partial<HeroImage>) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin Control Center</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Hero Section
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Edit the homepage hero (texts, animated words, buttons, stats, and background images).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchHero}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-brand-blue hover:text-brand-blue disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Badge Text</label>
              <input
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                placeholder="#1 Learning Platform in Rajasthan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                placeholder="Become A"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Highlight Prefix</label>
              <input
                value={highlightPrefix}
                onChange={(e) => setHighlightPrefix(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                placeholder="in just"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Highlight Number</label>
              <input
                type="number"
                value={toNumberInputValue(highlightNumber)}
                onChange={(e) => setHighlightNumber(parseOptionalNumber(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Highlight Suffix</label>
              <input
                value={highlightSuffix}
                onChange={(e) => setHighlightSuffix(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                placeholder="Months"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Scroll Text</label>
              <input
                value={scrollText}
                onChange={(e) => setScrollText(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                placeholder="Scroll"
              />
            </div>
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={showScrollIndicator}
                onChange={(e) => setShowScrollIndicator(e.target.checked)}
                className="h-4 w-4 rounded border-border text-brand-blue focus:ring-brand-blue"
              />
              Show scroll indicator
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Animated Words</h2>
              <p className="text-sm text-muted-foreground">Words cycling after the title.</p>
            </div>
            <button
              type="button"
              onClick={() => setAnimatedWords((prev) => [...prev, ""])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" />
              Add Word
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {animatedWords.map((word, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={word}
                  onChange={(e) =>
                    setAnimatedWords((prev) => prev.map((w, i) => (i === index ? e.target.value : w)))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="Full Stack Developer"
                />
                <button
                  type="button"
                  onClick={() => setAnimatedWords((prev) => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-600"
                  aria-label="Delete word"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {animatedWords.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No animated words yet. Add at least one.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Buttons</h2>
              <p className="text-sm text-muted-foreground">Primary hero CTAs.</p>
            </div>
            <button
              type="button"
              onClick={() => setButtons((prev) => [...prev, emptyButton()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" />
              Add Button
            </button>
          </div>

          <div className="space-y-3">
            {buttons.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No buttons yet. Add at least one primary action.
              </div>
            )}

            {buttons.map((btn, index) => (
              <div
                key={btn._id || index}
                className="rounded-lg border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Button #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setButtons((prev) => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Delete button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Label</label>
                    <input
                      type="text"
                      value={btn.label}
                      onChange={(e) => updateButton(index, { label: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="Join Now"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Href</label>
                    <input
                      type="text"
                      value={btn.href}
                      onChange={(e) => updateButton(index, { href: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="#enquiry"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Order</label>
                    <input
                      type="number"
                      value={toNumberInputValue(btn.order)}
                      onChange={(e) => updateButton(index, { order: parseOptionalNumber(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Style</label>
                    <select
                      value={btn.style}
                      onChange={(e) =>
                        updateButton(index, { style: e.target.value as HeroButton["style"] })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    >
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="outline">Outline</option>
                      <option value="ghost">Ghost</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Icon (name)</label>
                    <input
                      type="text"
                      value={btn.icon}
                      onChange={(e) => updateButton(index, { icon: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="ArrowRight"
                    />
                  </div>
                  <label className="mt-6 inline-flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={btn.isExternal}
                      onChange={(e) => updateButton(index, { isExternal: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand-blue focus:ring-brand-blue"
                    />
                    Open in new tab
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Stats</h2>
              <p className="text-sm text-muted-foreground">Number highlights displayed in cards.</p>
            </div>
            <button
              type="button"
              onClick={() => setStats((prev) => [...prev, emptyStat()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" />
              Add Stat
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {stats.map((stat, index) => (
              <div
                key={stat._id || index}
                className="rounded-lg border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Stat #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStats((prev) => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Delete stat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Label</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(index, { label: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="Students Trained"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Value</label>
                    <input
                      type="number"
                      value={toNumberInputValue(stat.value)}
                      onChange={(e) => updateStat(index, { value: parseOptionalNumber(e.target.value) })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Suffix</label>
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => updateStat(index, { suffix: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="+ / %"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Icon (name)</label>
                    <input
                      type="text"
                      value={stat.icon}
                      onChange={(e) => updateStat(index, { icon: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="Users"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Order</label>
                  <input
                    type="number"
                    value={toNumberInputValue(stat.order)}
                    onChange={(e) => updateStat(index, { order: parseOptionalNumber(e.target.value) })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>
            ))}
            {stats.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No stats yet. Add some metrics.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Background Images</h2>
              <p className="text-sm text-muted-foreground">Slider images shown behind the hero.</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue cursor-pointer">
              <Upload className="h-4 w-4" />
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewImages((prev) => [...prev, ...files]);
                }}
              />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {images.map((img, index) => (
              <div
                key={img._id || index}
                className="rounded-lg border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Image #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Delete image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Image URL</label>
                    <input
                      type="text"
                      value={img.url}
                      onChange={(e) => updateImage(index, { url: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Alt Text</label>
                    <input
                      type="text"
                      value={img.alt}
                      onChange={(e) => updateImage(index, { alt: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="Hero background"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Order</label>
                  <input
                    type="number"
                    value={toNumberInputValue(img.order)}
                    onChange={(e) => updateImage(index, { order: parseOptionalNumber(e.target.value) })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>
            ))}

            {images.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No images yet. Add URLs or upload new ones.
              </div>
            )}
          </div>

          {newImages.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">Images to upload ({newImages.length})</div>
              <ul className="list-disc pl-4 space-y-1">
                {newImages.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600"
                      onClick={() =>
                        setNewImages((prev) => prev.filter((_, fileIdx) => fileIdx !== idx))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminHeroSection;
