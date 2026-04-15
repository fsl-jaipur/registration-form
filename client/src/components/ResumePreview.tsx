import { ExternalLink, Mail, Phone } from "lucide-react";
import type { ResumeFormValues, ResumeRecord } from "@/features/resume/types";
import { withResumeDefaults } from "@/features/resume/utils";

type ResumePreviewProps = {
  resume: ResumeFormValues | ResumeRecord;
  className?: string;
};

const sectionHeading = (title: string, accentColor: string) => (
  <div className="mb-3 flex items-center gap-3">
    <div className="h-px flex-1 bg-border" />
    <h2
      className="text-[11px] font-bold uppercase tracking-[0.35em]"
      style={{ color: accentColor }}
    >
      {title}
    </h2>
    <div className="h-px flex-1 bg-border" />
  </div>
);

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
  const cardClasses =
    resume.themeMode === "dark"
      ? "border-slate-800 bg-slate-900/80"
      : "border-slate-200 bg-slate-50/70";

  const orderedSections = resume.sectionOrder.filter(
    (value, index, all) => all.indexOf(value) === index
  );

  const renderStandardSection = (sectionKey: string) => {
    switch (sectionKey) {
      case "summary":
        return resume.summary ? (
          <section key={sectionKey}>
            {sectionHeading("Summary", resume.accentColor)}
            <p className={`text-sm leading-7 ${subtleClasses}`}>{resume.summary}</p>
          </section>
        ) : null;
      case "skills":
        return resume.skills.length ? (
          <section key={sectionKey}>
            {sectionHeading("Skills", resume.accentColor)}
            <div className="flex flex-wrap gap-2">
              {resume.skills.filter(Boolean).map((skill) => (
                <span
                  key={skill}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${cardClasses}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        ) : null;
      case "experience":
        return resume.experience.length ? (
          <section key={sectionKey}>
            {sectionHeading("Experience", resume.accentColor)}
            <div className="space-y-5">
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
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">{item.role || "Role"}</h3>
                      <p className={`text-sm ${subtleClasses}`}>{item.company}</p>
                    </div>
                    <span className={`text-xs font-medium ${subtleClasses}`}>
                      {item.duration}
                    </span>
                  </div>
                  {item.description ? (
                    <p className={`mt-2 text-sm leading-7 ${subtleClasses}`}>
                      {item.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null;
      case "projects":
        return resume.projects.length ? (
          <section key={sectionKey}>
            {sectionHeading("Projects", resume.accentColor)}
            <div className="space-y-5">
              {resume.projects.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className={`rounded-2xl border p-4 ${cardClasses}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold">
                      {item.title || "Untitled project"}
                    </h3>
                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: resume.accentColor }}
                      >
                        {item.linkLabel || "View"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className={`mt-2 text-sm leading-7 ${subtleClasses}`}>
                      {item.description}
                    </p>
                  ) : null}
                  {item.techStack.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.techStack.filter(Boolean).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            color: resume.accentColor,
                            backgroundColor: `${resume.accentColor}20`,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null;
      case "education":
        return resume.education.length ? (
          <section key={sectionKey}>
            {sectionHeading("Education", resume.accentColor)}
            <div className="space-y-4">
              {resume.education.map((item, index) => (
                <article
                  key={`${item.degree}-${index}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <h3 className="text-base font-semibold">{item.degree || "Degree"}</h3>
                    <p className={`text-sm ${subtleClasses}`}>{item.college}</p>
                    {item.description ? (
                      <p className={`mt-1 text-sm ${subtleClasses}`}>{item.description}</p>
                    ) : null}
                  </div>
                  <span className={`text-xs font-medium ${subtleClasses}`}>
                    {item.year}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ) : null;
      case "certifications":
        return resume.certifications.length ? (
          <section key={sectionKey}>
            {sectionHeading("Certifications", resume.accentColor)}
            <div className="space-y-3">
              {resume.certifications.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className={`text-sm ${subtleClasses}`}>{item.issuer}</p>
                  </div>
                  <span className={`text-xs font-medium ${subtleClasses}`}>
                    {item.year}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ) : null;
      case "achievements":
        return resume.achievements.length ? (
          <section key={sectionKey}>
            {sectionHeading("Achievements", resume.accentColor)}
            <div className="space-y-3">
              {resume.achievements.map((item, index) => (
                <article key={`${item.title}-${index}`}>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  {item.description ? (
                    <p className={`mt-1 text-sm ${subtleClasses}`}>{item.description}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null;
      case "customSections":
        return resume.customSections.map((section, index) =>
          section.title || section.items.some(Boolean) ? (
            <section key={`${section.title}-${index}`}>
              {sectionHeading(section.title || "Additional", resume.accentColor)}
              <ul className={`space-y-2 text-sm ${subtleClasses}`}>
                {section.items.filter(Boolean).map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`} className="flex gap-2">
                    <span style={{ color: resume.accentColor }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`mx-auto w-full max-w-[820px] rounded-[32px] border shadow-[0_24px_80px_rgba(15,23,42,0.18)] ${darkClasses} ${className}`}
    >
      <div className={`rounded-[32px] p-8 sm:p-10 ${isMinimal ? "space-y-7" : "space-y-8"}`}>
        <header
          className={`flex flex-col gap-6 border-b pb-8 ${
            resume.themeMode === "dark" ? "border-slate-800" : "border-slate-200"
          } sm:flex-row sm:items-start sm:justify-between`}
        >
          <div className="flex items-start gap-4">
            {resume.profilePhoto ? (
              <img
                src={resume.profilePhoto}
                alt={resume.name || "Profile"}
                className="h-20 w-20 rounded-[24px] object-cover ring-4"
                style={{ boxShadow: `0 0 0 4px ${resume.accentColor}20` }}
              />
            ) : null}
            <div>
              <h1
                className={`text-3xl font-bold tracking-tight ${
                  isMinimal ? "text-2xl sm:text-3xl" : "sm:text-4xl"
                }`}
              >
                {resume.name || resume.title}
              </h1>
              <div className={`mt-3 flex flex-wrap gap-3 text-sm ${subtleClasses}`}>
                {resume.email ? (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {resume.email}
                  </span>
                ) : null}
                {resume.phone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {resume.phone}
                  </span>
                ) : null}
              </div>
              {resume.socialLinks.some((item) => item.label || item.url) ? (
                <div className={`mt-4 flex flex-wrap gap-3 text-sm ${subtleClasses}`}>
                  {resume.socialLinks
                    .filter((item) => item.label || item.url)
                    .map((item, index) => (
                      <a
                        key={`${item.label}-${index}`}
                        href={item.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border px-3 py-1.5 transition hover:-translate-y-0.5"
                        style={{
                          borderColor: `${resume.accentColor}30`,
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

          <div
            className={`min-w-[180px] rounded-[28px] border px-5 py-4 text-sm ${cardClasses}`}
            style={{
              background: `linear-gradient(180deg, ${resume.accentColor}14 0%, transparent 100%)`,
            }}
          >
            <p className="font-semibold" style={{ color: resume.accentColor }}>
              Selected Template
            </p>
            <p className={`mt-1 capitalize ${subtleClasses}`}>{resume.template}</p>
            <p className={`mt-4 text-xs uppercase tracking-[0.25em] ${subtleClasses}`}>
              Ready to print
            </p>
          </div>
        </header>

        <div className={`grid gap-8 ${isTimeline ? "lg:grid-cols-[1fr]" : "lg:grid-cols-[1fr]"}`}>
          {orderedSections.map((sectionKey) => renderStandardSection(sectionKey))}
        </div>
      </div>
    </div>
  );
}
