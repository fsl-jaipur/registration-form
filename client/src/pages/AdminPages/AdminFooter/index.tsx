import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useAdminContext } from "@/Context/Admincontext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  FOOTER_QUERY_KEY,
  fallbackFooter,
  fetchFooter,
  type FooterData,
  type FooterLink,
  type FooterSection,
  type FooterSocial,
} from "@/lib/api/footer";
import { parseOptionalNumber, toNumberInputValue } from "@/lib/utils";

const emptyLink = (): FooterLink => ({ label: "", href: "", order: undefined });
const emptySection = (): FooterSection => ({ title: "", links: [], order: undefined });
const emptySocial = (): FooterSocial => ({ label: "", href: "", icon: "LinkedIn", order: undefined });

export default function AdminFooter() {
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
  const [footer, setFooter] = useState<FooterData>(fallbackFooter);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (authChecked && (!isAuthenticated || role !== "admin")) {
      navigate("/admin/login", { replace: true });
    }
  }, [authChecked, isAuthenticated, role, navigate]);

  const load = async () => {
    if (!apiBase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchFooter();
      setFooter(data);
      setSectionId(data._id || null);
      setLogoFile(null);
      setLogoPreview(null);
      queryClient.setQueryData(FOOTER_QUERY_KEY, data);
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to load footer", variant: "destructive" });
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
    try {
      setSaving(true);
      const url = sectionId ? `${apiBase}/footer/${sectionId}` : `${apiBase}/footer`;
      const method = sectionId ? "PUT" : "POST";
      const hasFile = !!logoFile;
      const body = hasFile ? new FormData() : JSON.stringify(footer);

      if (hasFile) {
        const form = body as FormData;
        form.append("logo", logoFile as File);
        form.append("description", footer.description);
        form.append("ctaTitle", footer.ctaTitle);
        form.append("ctaSubtitle", footer.ctaSubtitle);
        form.append("ctaButtonLabel", footer.ctaButtonLabel);
        form.append("ctaButtonHref", footer.ctaButtonHref);
        form.append("sections", JSON.stringify(footer.sections));
        form.append("socials", JSON.stringify(footer.socials));
        form.append("bottomLinks", JSON.stringify(footer.bottomLinks));
        form.append("phone", footer.contact.phone);
        form.append("email", footer.contact.email);
        form.append("address", footer.contact.address);
        form.append("mapLink", footer.contact.mapLink);
      }

      const res = await fetch(url, {
        method,
        headers: hasFile ? undefined : { "Content-Type": "application/json" },
        credentials: "include",
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save footer");
      }
      const data = await fetchFooter();
      setFooter(data);
      setSectionId(data._id || null);
      queryClient.setQueryData(FOOTER_QUERY_KEY, data);
      toast({ title: "Footer saved" });
    } catch (error) {
      console.error(error);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof FooterData, value: string) =>
    setFooter((prev) => ({ ...prev, [key]: value }));

  const setSections = (sections: FooterSection[]) =>
    setFooter((prev) => ({ ...prev, sections }));

  const setSocials = (socials: FooterSocial[]) =>
    setFooter((prev) => ({ ...prev, socials }));

  const setBottomLinks = (links: FooterLink[]) =>
    setFooter((prev) => ({ ...prev, bottomLinks: links }));

  const handleLogoChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Admin / Footer</p>
            <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-brand-blue to-brand-orange bg-clip-text text-transparent">
              Footer
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Manage footer content, links, socials, and CTA.
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Logo URL</label>
              <input
                value={footer.logo}
                onChange={(e) => updateField("logo", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Logo Upload (optional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoChange(e.target.files)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
              {(logoPreview || footer.logo) && (
                <div className="flex items-center gap-3">
                  <img
                    src={logoPreview || footer.logo}
                    alt="Logo preview"
                    className="h-12 w-auto rounded border border-border bg-white object-contain p-1"
                  />
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                You can keep a URL or choose a file. If a file is selected, it will be uploaded and replace the current logo.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={footer.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CTA Title</label>
              <input
                value={footer.ctaTitle}
                onChange={(e) => updateField("ctaTitle", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CTA Subtitle</label>
              <input
                value={footer.ctaSubtitle}
                onChange={(e) => updateField("ctaSubtitle", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CTA Button Label</label>
              <input
                value={footer.ctaButtonLabel}
                onChange={(e) => updateField("ctaButtonLabel", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CTA Button Link</label>
              <input
                value={footer.ctaButtonHref}
                onChange={(e) => updateField("ctaButtonHref", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sections</h2>
            <button
              type="button"
              onClick={() => setSections([...footer.sections, emptySection()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {footer.sections.map((section, idx) => (
              <div key={section._id || idx} className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <input
                    value={section.title}
                    onChange={(e) =>
                      setSections(
                        footer.sections.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)),
                      )
                    }
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    placeholder="Section title"
                  />
                  <button
                    type="button"
                    onClick={() => setSections(footer.sections.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="number"
                  value={toNumberInputValue(section.order)}
                  onChange={(e) =>
                    setSections(
                      footer.sections.map((s, i) =>
                        i === idx ? { ...s, order: parseOptionalNumber(e.target.value) } : s,
                      ),
                    )
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="Order"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Links</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSections(
                          footer.sections.map((s, i) =>
                            i === idx ? { ...s, links: [...s.links, emptyLink()] } : s,
                          ),
                        )
                      }
                      className="text-xs text-brand-blue hover:underline"
                    >
                      + Add Link
                    </button>
                  </div>
                  {section.links.map((link, linkIdx) => (
                    <div key={link._id || linkIdx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        value={link.label}
                        onChange={(e) =>
                          setSections(
                            footer.sections.map((s, i) =>
                              i === idx
                                ? {
                                    ...s,
                                    links: s.links.map((l, j) =>
                                      j === linkIdx ? { ...l, label: e.target.value } : l,
                                    ),
                                  }
                                : s,
                            ),
                          )
                        }
                        className="rounded-lg border border-border px-2 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                        placeholder="Label"
                      />
                      <input
                        value={link.href}
                        onChange={(e) =>
                          setSections(
                            footer.sections.map((s, i) =>
                              i === idx
                                ? {
                                    ...s,
                                    links: s.links.map((l, j) =>
                                      j === linkIdx ? { ...l, href: e.target.value } : l,
                                    ),
                                  }
                                : s,
                            ),
                          )
                        }
                        className="rounded-lg border border-border px-2 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                        placeholder="#section"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSections(
                            footer.sections.map((s, i) =>
                              i === idx
                                ? { ...s, links: s.links.filter((_, j) => j !== linkIdx) }
                                : s,
                            ),
                          )
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Social Links</h2>
            <button
              type="button"
              onClick={() => setSocials([...footer.socials, emptySocial()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" /> Add Social
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {footer.socials.map((social, idx) => (
              <div key={social._id || idx} className="rounded-lg border border-border bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={social.label}
                    onChange={(e) =>
                      setSocials(
                        footer.socials.map((s, i) => (i === idx ? { ...s, label: e.target.value } : s)),
                      )
                    }
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    placeholder="Label"
                  />
                  <button
                    type="button"
                    onClick={() => setSocials(footer.socials.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  value={social.icon}
                  onChange={(e) =>
                    setSocials(footer.socials.map((s, i) => (i === idx ? { ...s, icon: e.target.value } : s)))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="Icon key (Facebook, X, Instagram, Youtube, LinkedIn)"
                />
                <input
                  value={social.href}
                  onChange={(e) =>
                    setSocials(footer.socials.map((s, i) => (i === idx ? { ...s, href: e.target.value } : s)))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="https://"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <input
                value={footer.contact.phone}
                onChange={(e) => setFooter((prev) => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                value={footer.contact.email}
                onChange={(e) => setFooter((prev) => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Address</label>
              <textarea
                value={footer.contact.address}
                onChange={(e) => setFooter((prev) => ({ ...prev, contact: { ...prev.contact, address: e.target.value } }))}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Map Link</label>
              <input
                value={footer.contact.mapLink}
                onChange={(e) => setFooter((prev) => ({ ...prev, contact: { ...prev.contact, mapLink: e.target.value } }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bottom Links</h2>
            <button
              type="button"
              onClick={() => setBottomLinks([...footer.bottomLinks, emptyLink()])}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-blue hover:border-brand-blue"
            >
              <Plus className="h-4 w-4" /> Add Link
            </button>
          </div>
          <div className="space-y-2">
            {footer.bottomLinks.map((link, idx) => (
              <div key={link._id || idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input
                  value={link.label}
                  onChange={(e) =>
                    setBottomLinks(
                      footer.bottomLinks.map((l, i) => (i === idx ? { ...l, label: e.target.value } : l)),
                    )
                  }
                  className="rounded-lg border border-border px-2 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="Label"
                />
                <input
                  value={link.href}
                  onChange={(e) =>
                    setBottomLinks(
                      footer.bottomLinks.map((l, i) => (i === idx ? { ...l, href: e.target.value } : l)),
                    )
                  }
                  className="rounded-lg border border-border px-2 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder="#"
                />
                <button
                  type="button"
                  onClick={() => setBottomLinks(footer.bottomLinks.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

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
      </main>
    </div>
  );
}
