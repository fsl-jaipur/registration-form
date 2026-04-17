import { ExternalLink, Mail, Phone } from "lucide-react";
import type { ResumeFormValues, ResumeRecord } from "@/features/resume/types";
import { withResumeDefaults } from "@/features/resume/utils";

type ResumePreviewProps = {
  resume: ResumeFormValues | ResumeRecord;
  className?: string;
};

const sectionTitle = (title: string, accentColor: string) => (
    <h2
    className="pt-1 text-[10px] font-bold"
      style={{ color: accentColor }}
    >
      {title}
    </h2>
);

const sectionGridClass =
  "grid grid-cols-[28mm_minmax(0,1fr)] gap-3 border-t border-border pt-1.5";

const linkHref = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "#";
  if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const isLinkText = (value: string) =>
  /^(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(\S*)$/i.test(value.trim());

export default function ResumePreview({ resume: resumeInput, className = "" }: ResumePreviewProps) {
  const resume = withResumeDefaults(resumeInput);
  const isTimeline = resume.template === "timeline";
  const isMinimal = resume.template === "minimal";
  const darkClasses =
    resume.themeMode === "dark"
      ? "bg-slate-950 text-slate-100 border-slate-800"
      : "bg-white text-slate-900 border-slate-200";
  const subtleClasses =
    resume.themeMode === "dark" ? "text-slate-400" : "text-slate-500";
  const pageBackgroundClass =
    resume.themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-300";

  const orderedSections = resume.sectionOrder.filter(
    (value, index, all) => all.indexOf(value) === index
  );

  const renderStandardSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "summary":
        return resume.summary ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Summary", resume.accentColor)}
              <p className={`text-xs leading-5 break-words [overflow-wrap:anywhere] ${subtleClasses}`}>{resume.summary}</p>
            </div>
          </section>
        ) : null;
      case "skills":
        return resume.skills.length ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Skills", resume.accentColor)}
              <div className="flex flex-wrap gap-2">
                {resume.skills.filter(Boolean).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center justify-center px-1 text-center text-xs font-semibold leading-none"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      case "experience":
        return resume.experience.length ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Experience", resume.accentColor)}
              <div className="space-y-2">
                {resume.experience.map((item, index) => (
                  <article
                    key={`${item.company}-${item.role}-${index}`}
                    className={
                      isTimeline
                        ? "relative pl-6 before:absolute before:left-1 before:top-2 before:h-full before:w-px before:bg-border"
                        : ""
                    }
                  >
                    {isTimeline ? (
                      <span
                        className="absolute left-0 top-1.5 h-3 w-3 rounded-full"
                        style={{ backgroundColor: resume.accentColor }}
                      />
                    ) : null}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold">{item.role || "Role"}</h3>
                        <p className={`text-[11px] ${subtleClasses}`}>{item.company}</p>
                      </div>
                      <span className={`shrink-0 text-right text-[10px] font-medium ${subtleClasses}`}>
                        {item.duration}
                      </span>
                    </div>
                    {item.description ? (
                      <p className={`mt-1 text-xs leading-5 break-words [overflow-wrap:anywhere] ${subtleClasses}`}>
                        {item.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      case "projects":
        return resume.projects.length ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Projects", resume.accentColor)}
              <div className="space-y-2">
                {resume.projects.map((item, index) => (
                  <article
                    key={`${item.title}-${index}`}
                    className="break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="break-words text-xs font-bold [overflow-wrap:anywhere]">
                        {item.title || "Untitled project"}
                      </h3>
                      {item.linkUrl ? (
                        <a
                          href={linkHref(item.linkUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center justify-center gap-1 text-[10px] font-semibold leading-none"
                          style={{ color: resume.accentColor }}
                        >
                          {item.linkLabel || "View"}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className={`mt-1 text-xs leading-5 break-words [overflow-wrap:anywhere] ${subtleClasses}`}>
                        {item.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      case "education":
        return resume.education.length ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Education", resume.accentColor)}
              <div className="space-y-2">
                {resume.education.map((item, index) => (
                  <article
                    key={`${item.degree}-${index}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold">{item.degree || "Degree"}</h3>
                      <p className={`text-[11px] ${subtleClasses}`}>{item.college}</p>
                      {item.description ? (
                        <p className={`mt-1 text-xs leading-5 ${subtleClasses}`}>{item.description}</p>
                      ) : null}
                    </div>
                    <span className={`shrink-0 text-right text-[10px] font-medium ${subtleClasses}`}>
                      {item.year}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null;
      case "certifications":
        return resume.certifications.length ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Certifications", resume.accentColor)}
              <div className="space-y-2">
              {resume.certifications.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    {item.credentialUrl ? (
                      <a
                        href={linkHref(item.credentialUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold underline-offset-2 hover:underline"
                        style={{ color: resume.accentColor }}
                      >
                        {item.title}
                      </a>
                    ) : (
                      <h3 className="text-xs font-semibold">{item.title}</h3>
                    )}
                    <p className={`text-[11px] ${subtleClasses}`}>{item.issuer}</p>
                  </div>
                  <span className={`shrink-0 text-right text-[10px] font-medium ${subtleClasses}`}>
                    {item.year}
                  </span>
                </article>
              ))}
              </div>
            </div>
          </section>
        ) : null;
      case "achievements":
        return resume.achievements.length ? (
          <section key={sectionKey} className="break-inside-avoid">
            <div className={sectionGridClass}>
              {sectionTitle("Achievements", resume.accentColor)}
              <div className="space-y-2">
              {resume.achievements.map((item, index) => (
                <article key={`${item.title}-${index}`}>
                  <h3 className="text-xs font-semibold">{item.title}</h3>
                  {item.description ? (
                    <p className={`mt-1 text-xs leading-5 ${subtleClasses}`}>{item.description}</p>
                  ) : null}
                </article>
              ))}
              </div>
            </div>
          </section>
        ) : null;
      case "customSections":
        return resume.customSections.map((section, index) =>
          section.title || section.items.some(Boolean) ? (
            <section key={`${section.title}-${index}`} className="break-inside-avoid">
              <div className={sectionGridClass}>
              {sectionTitle(section.title || "Additional", resume.accentColor)}
              <ul className={`space-y-1 text-xs leading-5 ${subtleClasses}`}>
                {section.items.filter(Boolean).map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`} className="flex gap-2">
                    <span style={{ color: resume.accentColor }}>•</span>
                    {isLinkText(item) ? (
                      <a
                        href={linkHref(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-2 hover:underline"
                        style={{ color: resume.accentColor }}
                      >
                        {item}
                      </a>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
              </ul>
              </div>
            </section>
          ) : null
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mx-auto w-full overflow-x-auto ${className}`}>
      <div
        data-resume-page="true"
        className={`mx-auto min-h-[297mm] w-[210mm] max-w-full border shadow-[0_12px_32px_rgba(15,23,42,0.12)] ${pageBackgroundClass} ${darkClasses}`}
      >
      <div className={`min-h-[297mm] p-[10mm] sm:p-[12mm] ${isMinimal ? "space-y-4" : "space-y-5"}`}>
        <header className="flex flex-col items-center gap-5 pb-4 text-center">
          <div className="flex max-w-full flex-col items-center gap-4">
            {resume.profilePhoto ? (
              <img
                src={resume.profilePhoto}
                alt={resume.name || "Profile"}
                className="h-20 w-20 rounded-2xl object-cover ring-4"
                style={{ boxShadow: `0 0 0 4px ${resume.accentColor}20` }}
              />
            ) : null}
            <div className="min-w-0">
              <h1
                className={`break-words text-3xl font-bold tracking-tight [overflow-wrap:anywhere] ${
                  isMinimal ? "text-2xl sm:text-3xl" : "sm:text-4xl"
                }`}
              >
                {resume.name || "Full Name"}
              </h1>
              <div className={`mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm ${subtleClasses}`}>
                {resume.email ? (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    {resume.email}
                  </span>
                ) : null}
                {resume.phone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    {resume.phone}
                  </span>
                ) : null}
              </div>
              {resume.socialLinks.some((item) => item.label || item.url) ? (
                <div className={`mt-4 flex flex-wrap justify-center gap-3 text-sm ${subtleClasses}`}>
                  {resume.socialLinks
                    .filter((item) => item.label || item.url)
                    .map((item, index) => (
                      <a
                        key={`${item.label}-${index}`}
                        href={linkHref(item.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 text-center font-medium transition hover:-translate-y-0.5"
                        style={{
                          color: resume.accentColor,
                        }}
                      >
                        {item.label || item.url}
                      </a>
                    ))}
                </div>
              ) : null}
            </div>
          </div>
              
        </header>

        <div className={`grid gap-2 ${isTimeline ? "lg:grid-cols-[1fr]" : "lg:grid-cols-[1fr]"}`}>
          {orderedSections.map((sectionKey) => renderStandardSection(sectionKey))}
        </div>
      </div>
      </div>
    </div>
  );
}
