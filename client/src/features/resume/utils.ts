import type {
  ResumeFormValues,
  ResumeRecord,
  ResumeSuggestion,
  ResumeSummary,
} from "./types";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safe = (value?: string) => escapeHtml(value?.trim() || "");

const renderList = (items: string[]) =>
  items.filter(Boolean).map((item) => `<li>${safe(item)}</li>`).join("");

const sectionTitle = (title: string, accentColor: string) =>
  `<h2 style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${accentColor};margin:0 0 10px;font-weight:700;">${safe(title)}</h2>`;

export const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const withResumeDefaults = (
  resume?: Partial<ResumeFormValues> | Partial<ResumeRecord>
): ResumeFormValues => ({
  title: resume?.title || "My Resume",
  name: resume?.name || (resume as ResumeRecord | undefined)?.ownerName || "",
  email: resume?.email || (resume as ResumeRecord | undefined)?.ownerEmail || "",
  phone: resume?.phone || "",
  profilePhoto: resume?.profilePhoto || "",
  summary: resume?.summary || "",
  socialLinks: resume?.socialLinks || [],
  skills: resume?.skills || [],
  projects: resume?.projects || [],
  experience: resume?.experience || [],
  education: resume?.education || [],
  certifications: resume?.certifications || [],
  achievements: resume?.achievements || [],
  customSections: resume?.customSections || [],
  linkedInImport: resume?.linkedInImport || { profileUrl: "", importSource: "" },
  sectionOrder:
    resume?.sectionOrder || [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certifications",
      "achievements",
      "customSections",
    ],
  template: resume?.template || "executive",
  themeMode: resume?.themeMode || "light",
  accentColor: resume?.accentColor || "#0f766e",
  shared: Boolean(resume?.shared),
});

export const createResumePayload = (resume: ResumeFormValues) => ({
  ...resume,
  skills: resume.skills.filter(Boolean),
  projects: resume.projects.map((project) => ({
    ...project,
    techStack: project.techStack.filter(Boolean),
  })),
  customSections: resume.customSections.map((section) => ({
    ...section,
    items: section.items.filter(Boolean),
  })),
});

export const decodeLinkedInPayload = (value: string) => {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return JSON.parse(atob(`${normalized}${padding}`));
  } catch {
    return null;
  }
};

export const downloadJsonFile = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const getShareUrl = (shareSlug?: string) =>
  shareSlug ? `${window.location.origin}/resume/shared/${shareSlug}` : "";

export const buildResumeHtml = (resumeInput: ResumeFormValues | ResumeRecord) => {
  const resume = withResumeDefaults(resumeInput);
  const isDark = resume.themeMode === "dark";
  const background = isDark ? "#0f172a" : "#ffffff";
  const surface = isDark ? "#111827" : "#f8fafc";
  const text = isDark ? "#e5eef9" : "#0f172a";
  const subtle = isDark ? "#94a3b8" : "#475569";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const accent = resume.accentColor || "#0f766e";

  const socialLinks = resume.socialLinks
    .filter((item) => item.label || item.url)
    .map(
      (item) =>
        `<span style="display:inline-flex;gap:6px;align-items:center;"><strong>${safe(item.label)}:</strong> ${safe(item.url)}</span>`
    )
    .join(" <span style=\"color:${subtle};\">•</span> ");

  const skills = resume.skills.length
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Skills", accent)}
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${resume.skills
            .filter(Boolean)
            .map(
              (skill) =>
                `<span style="padding:6px 10px;border-radius:999px;background:${surface};border:1px solid ${border};font-size:12px;">${safe(skill)}</span>`
            )
            .join("")}
        </div>
      </section>
    `
    : "";

  const experience = resume.experience.length
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Experience", accent)}
        ${resume.experience
          .map(
            (item) => `
              <article style="margin-bottom:18px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                  <div>
                    <h3 style="margin:0;font-size:16px;font-weight:700;">${safe(item.role)}</h3>
                    <p style="margin:4px 0 0;color:${subtle};font-size:13px;">${safe(item.company)}</p>
                  </div>
                  <span style="font-size:12px;color:${subtle};white-space:nowrap;">${safe(item.duration)}</span>
                </div>
                <p style="margin:8px 0 0;color:${text};font-size:13px;line-height:1.7;">${safe(item.description)}</p>
              </article>
            `
          )
          .join("")}
      </section>
    `
    : "";

  const projects = resume.projects.length
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Projects", accent)}
        ${resume.projects
          .map(
            (item) => `
              <article style="margin-bottom:18px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                  <h3 style="margin:0;font-size:16px;font-weight:700;">${safe(item.title)}</h3>
                  ${
                    item.linkUrl
                      ? `<a href="${safe(item.linkUrl)}" style="font-size:12px;color:${accent};text-decoration:none;">${safe(item.linkLabel || "Project Link")}</a>`
                      : ""
                  }
                </div>
                <p style="margin:8px 0 0;color:${text};font-size:13px;line-height:1.7;">${safe(item.description)}</p>
                ${
                  item.techStack.length
                    ? `<p style="margin:8px 0 0;color:${subtle};font-size:12px;"><strong>Tech:</strong> ${item.techStack
                        .map(safe)
                        .join(", ")}</p>`
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </section>
    `
    : "";

  const education = resume.education.length
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Education", accent)}
        ${resume.education
          .map(
            (item) => `
              <article style="margin-bottom:18px;">
                <div style="display:flex;justify-content:space-between;gap:12px;">
                  <div>
                    <h3 style="margin:0;font-size:16px;font-weight:700;">${safe(item.degree)}</h3>
                    <p style="margin:4px 0 0;color:${subtle};font-size:13px;">${safe(item.college)}</p>
                  </div>
                  <span style="font-size:12px;color:${subtle};white-space:nowrap;">${safe(item.year)}</span>
                </div>
                ${item.description ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.7;">${safe(item.description)}</p>` : ""}
              </article>
            `
          )
          .join("")}
      </section>
    `
    : "";

  const certifications = resume.certifications.length
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Certifications", accent)}
        <ul style="margin:0;padding-left:18px;line-height:1.8;color:${text};">
          ${resume.certifications
            .map(
              (item) =>
                `<li><strong>${safe(item.title)}</strong>${item.issuer ? `, ${safe(item.issuer)}` : ""}${item.year ? ` (${safe(item.year)})` : ""}</li>`
            )
            .join("")}
        </ul>
      </section>
    `
    : "";

  const achievements = resume.achievements.length
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Achievements", accent)}
        <ul style="margin:0;padding-left:18px;line-height:1.8;color:${text};">
          ${resume.achievements
            .map(
              (item) =>
                `<li><strong>${safe(item.title)}</strong>${item.description ? ` — ${safe(item.description)}` : ""}</li>`
            )
            .join("")}
        </ul>
      </section>
    `
    : "";

  const customSections = resume.customSections
    .filter((section) => section.title || section.items.length)
    .map(
      (section) => `
        <section style="margin-top:24px;">
          ${sectionTitle(section.title || "Additional", accent)}
          <ul style="margin:0;padding-left:18px;line-height:1.8;color:${text};">
            ${renderList(section.items)}
          </ul>
        </section>
      `
    )
    .join("");

  const summary = resume.summary
    ? `
      <section style="margin-top:24px;">
        ${sectionTitle("Summary", accent)}
        <p style="margin:0;color:${text};font-size:13px;line-height:1.8;">${safe(resume.summary)}</p>
      </section>
    `
    : "";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${safe(resume.title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Inter, Segoe UI, Arial, sans-serif;
            background: #e2e8f0;
            color: ${text};
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 16px auto;
            background: ${background};
            padding: 28px;
          }
          @media print {
            body { background: transparent; }
            .page { margin: 0; width: auto; min-height: auto; }
          }
          a { color: ${accent}; }
        </style>
      </head>
      <body>
        <div class="page">
          <header style="display:flex;gap:20px;align-items:flex-start;border-bottom:1px solid ${border};padding-bottom:20px;">
            ${
              resume.profilePhoto
                ? `<img src="${resume.profilePhoto}" alt="${safe(resume.name)}" style="height:84px;width:84px;border-radius:22px;object-fit:cover;border:3px solid ${surface};" />`
                : ""
            }
            <div style="flex:1;">
              <h1 style="margin:0;font-size:32px;line-height:1.1;">${safe(resume.name || resume.title)}</h1>
              <p style="margin:8px 0 0;color:${subtle};font-size:14px;">${[resume.email, resume.phone].filter(Boolean).map(safe).join(" • ")}</p>
              ${socialLinks ? `<p style="margin:10px 0 0;color:${subtle};font-size:13px;line-height:1.7;">${socialLinks}</p>` : ""}
            </div>
          </header>
          ${summary}
          ${skills}
          ${experience}
          ${projects}
          ${education}
          ${certifications}
          ${achievements}
          ${customSections}
        </div>
      </body>
    </html>
  `;
};

export const printResume = (resume: ResumeFormValues | ResumeRecord) => {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!popup) return false;
  popup.document.open();
  popup.document.write(buildResumeHtml(resume));
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 300);
  return true;
};

export const getResumeSuggestions = (resume: ResumeFormValues): ResumeSuggestion[] => {
  const suggestions: ResumeSuggestion[] = [];

  if (resume.summary.trim().length < 80) {
    suggestions.push({
      id: "summary",
      title: "Strengthen your summary",
      description: "Add a 2-3 sentence snapshot with years of experience, strengths, and measurable outcomes.",
    });
  }

  if (resume.skills.length < 5) {
    suggestions.push({
      id: "skills",
      title: "Add more targeted skills",
      description: "Include role-specific tools, frameworks, and soft skills that match the jobs you want.",
    });
  }

  if (!resume.projects.some((project) => project.description.length > 80)) {
    suggestions.push({
      id: "projects",
      title: "Show project impact",
      description: "Expand at least one project with what you built, how you built it, and the outcome.",
    });
  }

  if (!resume.experience.some((item) => /\d/.test(item.description))) {
    suggestions.push({
      id: "experience",
      title: "Quantify experience",
      description: "Add numbers like growth %, users served, releases shipped, or efficiency improvements.",
    });
  }

  if (!resume.socialLinks.some((item) => item.url.trim())) {
    suggestions.push({
      id: "links",
      title: "Add proof of work",
      description: "Include LinkedIn, GitHub, or portfolio links so recruiters can validate your work quickly.",
    });
  }

  return suggestions;
};

export const createResumeFilename = (resume: Pick<ResumeSummary, "title">) =>
  `${resume.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}.json`;
