import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  fallbackCareerSection,
  fetchCareerSection,
  type CareerSectionData,
} from "@/lib/api/career";

type CareerFormState = {
  name: string;
  email: string;
  resume: File | null;
};

const initialFormState: CareerFormState = {
  name: "",
  email: "",
  resume: null,
};

const iconMap: Record<string, LucideIcon> = {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Sparkles,
  Users,
};

const accentClassMap: Record<string, string> = {
  "brand-blue": "text-brand-blue",
  "brand-orange": "text-brand-orange",
};

export default function CareerPage() {
  const [content, setContent] = useState<CareerSectionData>(fallbackCareerSection);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [formState, setFormState] = useState<CareerFormState>(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadCareerPage = async () => {
      try {
        const data = await fetchCareerSection();
        setContent(data);
      } catch (fetchError) {
        console.error("career section fetch error", fetchError);
      }
    };

    void loadCareerPage();
  }, []);

  useEffect(() => {
    if (!isApplyOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isApplyOpen, submitting]);

  const handleOpenModal = () => {
    setError("");
    setSuccess("");
    setIsApplyOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setIsApplyOpen(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFormState((prev) => ({ ...prev, resume: null }));
      setError("");
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFormState((prev) => ({ ...prev, resume: null }));
      setError("Please upload resume only in PDF format.");
      event.target.value = "";
      return;
    }

    setError("");
    setFormState((prev) => ({ ...prev, resume: selectedFile }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.resume) {
      setError("Please upload your resume in PDF format.");
      setSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const apiBase = import.meta.env.VITE_API_URL;
      const payload = new FormData();
      payload.append("name", formState.name.trim());
      payload.append("email", formState.email.trim());
      payload.append("resume", formState.resume);

      const response = await fetch(`${apiBase}/students/career-apply`, {
        method: "POST",
        body: payload,
      });

      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};

      if (!response.ok) {
        throw new Error(data?.message ?? "Failed to submit application.");
      }

      setSuccess(data?.message ?? "Application submitted successfully.");
      setFormState(initialFormState);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while submitting the application.";
      setError(message);
      setSuccess("");
    } finally {
      setSubmitting(false);
    }
  };

  const mailToHref = `mailto:${content.ctaEmailAddress}?subject=${encodeURIComponent(
    content.ctaEmailSubject,
  )}&body=${encodeURIComponent(content.ctaEmailBody)}`;
  const telHref = `tel:${content.ctaPhoneNumber.replace(/\s+/g, "")}`;

  return (
    <>
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.14),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_100%)]">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-8 top-10 h-28 w-28 rounded-full bg-brand-orange/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-brand-blue/15 blur-3xl" />
          </div>

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue-light px-4 py-1.5 text-sm font-semibold text-brand-blue">
                  <Sparkles size={16} />
                  {content.heroBadge}
                </span>
                <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                  {content.heroTitle}
                  <span className="text-gradient-brand"> {content.heroHighlight}</span>
                </h1>
                <p className="mt-5 text-lg text-muted-foreground md:text-xl">
                  {content.heroDescription}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="inline-flex items-center justify-center gap-2 rounded-lg gradient-brand px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                  >
                    {content.applyButtonLabel}
                    <ArrowRight size={16} />
                  </button>
                  <a
                    href="#open-roles"
                    className="inline-flex items-center justify-center rounded-lg border border-brand-blue px-6 py-3 text-sm font-semibold text-brand-blue transition-all duration-200 hover:bg-brand-blue hover:text-white"
                  >
                    {content.rolesButtonLabel}
                  </a>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {content.highlightCards.map((card, index) => {
                  const Icon = iconMap[card.icon] || BriefcaseBusiness;
                  const accentClassName = accentClassMap[card.accent] || "text-brand-blue";
                  const wideCard = index === content.highlightCards.length - 1 && content.highlightCards.length % 2 === 1;

                  return (
                    <div
                      key={card._id || `${card.title}-${index}`}
                      className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${wideCard ? "sm:col-span-2" : ""}`}
                    >
                      <Icon className={`mb-4 ${accentClassName}`} size={24} />
                      <h2 className="text-lg font-semibold">{card.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="open-roles" className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-brand-orange/10 px-4 py-1.5 text-sm font-semibold text-brand-orange">
              {content.roleSectionBadge}
            </span>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">{content.roleSectionTitle}</h2>
            <p className="mt-3 text-muted-foreground">{content.roleSectionDescription}</p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {content.openings.map((opening) => (
              <article
                key={opening._id || `${opening.title}-${opening.location}`}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-brand-blue">
                  <BriefcaseBusiness size={16} />
                  {opening.type}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{opening.title}</h3>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} />
                  {opening.location}
                </div>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{opening.summary}</p>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="mt-6 inline-flex items-center gap-2 text-left text-sm font-semibold text-brand-blue transition-opacity duration-200 hover:opacity-80"
                >
                  Apply for this role
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="container mx-auto grid gap-10 px-4 py-14 md:py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{content.benefitsTitle}</h2>
              <div className="mt-6 space-y-4">
                {content.benefits.map((benefit) => (
                  <div key={benefit} className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground shadow-sm">
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold md:text-4xl">{content.hiringStepsTitle}</h2>
              <div className="mt-6 space-y-4">
                {content.hiringSteps.map((step, index) => (
                  <div key={`${step}-${index}`} className="flex gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-2 text-sm leading-6 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-14 md:py-20">
          <div className="rounded-3xl bg-brand-blue px-6 py-10 text-white md:px-10 md:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">{content.ctaEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{content.ctaTitle}</h2>
            <p className="mt-4 max-w-2xl text-white/85">{content.ctaDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailToHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-blue transition-all duration-200 hover:opacity-90"
              >
                {content.ctaEmailLabel}
              </a>
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
              >
                {content.ctaPhoneLabel}
              </a>
            </div>
          </div>
        </section>
      </main>

      {isApplyOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="absolute inset-0" aria-hidden="true" onClick={handleCloseModal} />

          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{content.modalTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{content.modalDescription}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close application form"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-6">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="career-name" className="mb-1.5 block text-sm font-medium text-foreground">
                    Name
                  </label>
                  <input
                    id="career-name"
                    name="name"
                    type="text"
                    value={formState.name}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="Enter your full name"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="career-email" className="mb-1.5 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="career-email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    placeholder="Enter your email"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="career-resume" className="mb-1.5 block text-sm font-medium text-foreground">
                    Upload your resume
                  </label>
                  <input
                    ref={resumeInputRef}
                    id="career-resume"
                    name="resume"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeChange}
                    className="block w-full rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
                    required
                    disabled={submitting}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">{content.resumeHelperText}</p>
                  {formState.resume && (
                    <p className="mt-2 text-sm font-medium text-brand-blue">
                      Selected file: {formState.resume.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : content.submitButtonLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted"
                    disabled={submitting}
                  >
                    {content.cancelButtonLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
