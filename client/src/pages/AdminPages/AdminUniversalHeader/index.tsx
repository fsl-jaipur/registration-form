import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Trash2,
  Upload,
  RefreshCw,
  Link2,
  ExternalLink,
} from "lucide-react";
import { useAdminContext } from "@/Context/Admincontext";
import { useToast } from "@/hooks/use-toast";
import {
  broadcastUniversalHeaderUpdate,
  normalizeUniversalHeader,
  resolveUniversalHeaderAsset,
  type UniversalHeaderButton as Button,
  type UniversalHeaderData,
  type UniversalHeaderNavItem as NavItem,
  UNIVERSAL_HEADER_QUERY_KEY,
} from "@/lib/api/universalHeader";
import { parseOptionalNumber, toNumberInputValue } from "@/lib/utils";

const emptyNavItem = (): NavItem => ({
  label: "",
  href: "",
  order: undefined,
  isExternal: false,
});

const emptyButton = (): Button => ({
  label: "",
  href: "",
  style: "primary",
  order: undefined,
});

const AdminUniversalHeader = () => {
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
  const [headerId, setHeaderId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/images/logo.png");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoAlt, setLogoAlt] = useState<string>("FullStack Learning");
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [buttons, setButtons] = useState<Button[]>([]);

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  const applyHeaderState = (header: UniversalHeaderData) => {
    setHeaderId(header._id ?? null);
    setLogoUrl(resolveUniversalHeaderAsset(header.logo));
    setLogoAlt(header.logoAlt || "FullStack Learning");
    setNavItems(header.navItems ?? []);
    setButtons(header.buttons ?? []);
    queryClient.setQueryData(UNIVERSAL_HEADER_QUERY_KEY, header);
  };

  const fetchHeader = async () => {
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
      const res = await fetch(`${apiBase}/universal-header`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch universal header");
      const data = await res.json();
      applyHeaderState(normalizeUniversalHeader(data?.header));
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to load header",
        description: "Refresh or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiBase) fetchHeader();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!apiBase) {
      toast({
        title: "Missing API base URL",
        description: "Set VITE_API_URL and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!navItems.length) {
      toast({
        title: "Add at least one navigation link",
        variant: "destructive",
      });
      return;
    }

    if (!buttons.length) {
      toast({
        title: "Add at least one button (e.g., Enroll/Login)",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const body = new FormData();
      if (logoFile) body.append("logo", logoFile);
      if (logoAlt) body.append("logoAlt", logoAlt);
      body.append("navItems", JSON.stringify(navItems));
      body.append("buttons", JSON.stringify(buttons));

      const url = headerId
        ? `${apiBase}/universal-header/${headerId}`
        : `${apiBase}/universal-header`;
      const method = headerId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save universal header");
      }

      const data = await res.json();
      const header = normalizeUniversalHeader(data?.header);
      applyHeaderState(header);
      setLogoFile(null);
      void queryClient.invalidateQueries({ queryKey: UNIVERSAL_HEADER_QUERY_KEY });
      broadcastUniversalHeaderUpdate();

      toast({ title: "Universal header saved" });
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNavItem = (index: number, patch: Partial<NavItem>) => {
    setNavItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateButton = (index: number, patch: Partial<Button>) => {
    setButtons((prev) =>
      prev.map((btn, i) => (i === index ? { ...btn, ...patch } : btn)),
    );
  };

  const removeNavItem = (index: number) => {
    setNavItems((prev) => prev.filter((_, i) => i !== index));
  };

  const removeButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin Control Center</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Universal Header
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Edit the shared site header (logo, navigation, and CTAs). Changes apply everywhere the universal header is rendered.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchHeader}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:border-brand-blue hover:text-brand-blue disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Branding</h2>
                <p className="text-sm text-muted-foreground">Logo and alt text</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-full sm:w-56 h-28 rounded-lg border border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={logoAlt || "Logo preview"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">No logo</span>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-sm font-medium text-foreground">Logo Alt Text</label>
                <input
                  type="text"
                  value={logoAlt}
                  onChange={(e) => setLogoAlt(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="FullStack Learning"
                />

                <label className="text-sm font-medium text-foreground">Replace Logo (optional)</label>
                <label className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground hover:border-brand-blue">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-brand-blue" />
                    <span className="font-medium text-foreground/80">
                      {logoFile ? logoFile.name : "Upload new logo"}
                    </span>
                  </div>
                  <span className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-brand-blue shadow-sm">
                    Browse
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
                {logoFile && (
                  <button
                    type="button"
                    onClick={() => handleLogoChange(null)}
                    className="text-xs text-muted-foreground underline"
                  >
                    Keep existing logo
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Call-to-Action Buttons</h2>
                <p className="text-sm text-muted-foreground">Login, Signup, Enroll, etc.</p>
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
                      <Link2 className="h-4 w-4" />
                      Button #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeButton(index)}
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
                        placeholder="Enroll Now"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Href</label>
                      <input
                        type="text"
                        value={btn.href}
                        onChange={(e) => updateButton(index, { href: e.target.value })}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                        placeholder="/register"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Order</label>
                      <input
                        type="number"
                        value={toNumberInputValue(btn.order)}
                        onChange={(e) =>
                          updateButton(index, { order: parseOptionalNumber(e.target.value) })
                        }
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Style</label>
                      <select
                        value={btn.style}
                        onChange={(e) =>
                          updateButton(index, {
                            style: e.target.value as Button["style"],
                          })
                        }
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      >
                        <option value="primary">Primary (gradient)</option>
                        <option value="secondary">Secondary</option>
                        <option value="outline">Outline</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Navigation Links</h2>
              <p className="text-sm text-muted-foreground">Manage header menu items.</p>
            </div>
            <button
              type="button"
              onClick={() => setNavItems((prev) => [...prev, emptyNavItem()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" />
              Add Nav Item
            </button>
          </div>

          {navItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
              No navigation items yet. Add links to match the public header.
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {navItems.map((item, index) => (
              <div
                key={item._id || index}
                className="rounded-lg border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    Nav #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNavItem(index)}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Delete navigation item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateNavItem(index, { label: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="Home"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Href</label>
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateNavItem(index, { href: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="#home or /lifeatfsl"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Order</label>
                    <input
                      type="number"
                      value={toNumberInputValue(item.order)}
                      onChange={(e) =>
                        updateNavItem(index, { order: parseOptionalNumber(e.target.value) })
                      }
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>
                  <label className="mt-6 inline-flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={item.isExternal}
                      onChange={(e) => updateNavItem(index, { isExternal: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-brand-blue focus:ring-brand-blue"
                    />
                    Open in new tab
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Saving updates the shared header immediately.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Universal Header"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminUniversalHeader;
