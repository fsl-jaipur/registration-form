import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminContext } from "@/Context/Admincontext";
import { useNavigate } from "react-router-dom";
import { parseOptionalNumber, toNumberInputValue } from "@/lib/utils";

type Company = {
  _id?: string;
  name: string;
  logo?: string;
  order?: number;
};

type CompaniesSectionResponse = {
  _id: string;
  badgeText: string;
  heading: string;
  description: string;
  companies: Company[];
};

const emptyCompany = (): Company => ({
  name: "",
  logo: "",
  order: undefined,
});

const AdminCompanies = () => {
  const { isAuthenticated, role, authChecked } = useAdminContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [badgeText, setBadgeText] = useState("Companies Hiring Our Students");
  const [heading, setHeading] = useState("Our Students Work At Top Companies");
  const [description, setDescription] = useState(
    "Our graduates are working at the world's leading technology companies",
  );
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  const fetchSection = async () => {
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
      const res = await fetch(`${apiBase}/companies-section`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies section");
      const data = await res.json();
      const section: CompaniesSectionResponse = data.section;
      setSectionId(section._id);
      setBadgeText(section.badgeText || "");
      setHeading(section.heading || "");
      setDescription(section.description || "");
      setCompanies(section.companies || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to load companies",
        description: "Refresh or check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiBase) fetchSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const handleSave = async () => {
    if (!apiBase) {
      toast({ title: "Missing API base URL", variant: "destructive" });
      return;
    }

    if (!heading.trim()) {
      toast({ title: "Heading is required", variant: "destructive" });
      return;
    }

    if (!companies.length) {
      toast({ title: "Add at least one company", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        badgeText,
        heading,
        description,
        companies,
      };

      const url = sectionId
        ? `${apiBase}/companies-section/${sectionId}`
        : `${apiBase}/companies-section`;
      const method = sectionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save companies section");
      }

      const data = await res.json();
      const section: CompaniesSectionResponse = data.section;
      setSectionId(section._id);
      setBadgeText(section.badgeText || "");
      setHeading(section.heading || "");
      setDescription(section.description || "");
      setCompanies(section.companies || []);

      toast({ title: "Companies section saved" });
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

  const updateCompany = (index: number, patch: Partial<Company>) => {
    setCompanies((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin Control Center</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Companies Hiring Our Students
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Edit the heading and manage the list of companies shown in the homepage marquee.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchSection}
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
                placeholder="Companies Hiring Our Students"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Heading</label>
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                placeholder="Our Students Work At Top Companies"
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
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Companies</h2>
              <p className="text-sm text-muted-foreground">Add, edit, or reorder companies.</p>
            </div>
            <button
              type="button"
              onClick={() => setCompanies((prev) => [...prev, emptyCompany()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" />
              Add Company
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {companies.map((company, index) => (
              <div
                key={company._id || index}
                className="rounded-lg border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Company #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompanies((prev) => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-600"
                    aria-label="Delete company"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Name</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => updateCompany(index, { name: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Logo URL (optional)</label>
                    <input
                      type="text"
                      value={company.logo || ""}
                      onChange={(e) => updateCompany(index, { logo: e.target.value })}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Order</label>
                  <input
                    type="number"
                    value={toNumberInputValue(company.order)}
                    onChange={(e) => updateCompany(index, { order: parseOptionalNumber(e.target.value) })}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                No companies yet. Add at least one company to display on the homepage.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminCompanies;
