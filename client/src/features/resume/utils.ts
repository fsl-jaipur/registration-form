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

const linkHref = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "#";
  if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const isLinkText = (value: string) =>
  /^(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(\S*)$/i.test(value.trim());

const renderList = (items: string[]) =>
  items
    .filter(Boolean)
    .map((item) =>
      isLinkText(item)
        ? `<li><a href="${safe(linkHref(item))}">${safe(item)}</a></li>`
        : `<li>${safe(item)}</li>`
    )
    .join("");

const sectionTitle = (title: string, accentColor: string) =>
  `<div style="display:grid;grid-template-columns:28mm minmax(0,1fr);gap:12px;align-items:center;border-top:1px solid #e2e8f0;padding-top:5px;margin:0 0 8px;">
    <h2 style="font-size:10px;color:${accentColor};margin:0;font-weight:700;">${safe(title)}</h2>
  </div>`;

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
        item.url
          ? `<a href="${safe(linkHref(item.url))}" style="display:inline-flex;justify-content:center;padding:4px 8px;color:${accent};text-decoration:none;font-weight:600;">${safe(item.label || item.url)}</a>`
          : `<span style="display:inline-flex;justify-content:center;padding:4px 8px;color:${accent};font-weight:600;">${safe(item.label)}</span>`
    )
    .join("");

  const skills = resume.skills.length
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Skills", accent)}
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-left:31mm;">
          ${resume.skills
            .filter(Boolean)
            .map(
              (skill) =>
                `<span style="display:inline-flex;align-items:center;justify-content:center;padding:2px 4px;font-size:10px;font-weight:700;">${safe(skill)}</span>`
            )
            .join("")}
        </div>
      </section>
    `
    : "";

  const experience = resume.experience.length
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Experience", accent)}
        <div style="margin-left:31mm;">
        ${resume.experience
          .map(
            (item) => `
              <article style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                  <div>
                    <h3 style="margin:0;font-size:12px;font-weight:700;">${safe(item.role)}</h3>
                    <p style="margin:2px 0 0;color:${subtle};font-size:11px;">${safe(item.company)}</p>
                  </div>
                  <span style="font-size:10px;color:${subtle};white-space:nowrap;">${safe(item.duration)}</span>
                </div>
                <p style="margin:4px 0 0;color:${text};font-size:11px;line-height:1.45;">${safe(item.description)}</p>
              </article>
            `
          )
          .join("")}
        </div>
      </section>
    `
    : "";

  const projects = resume.projects.length
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Projects", accent)}
        <div style="margin-left:31mm;">
        ${resume.projects
          .map(
            (item) => `
              <article style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                  <h3 style="margin:0;font-size:12px;font-weight:700;">${safe(item.title)}</h3>
                  ${
                    item.linkUrl
                      ? `<a href="${safe(linkHref(item.linkUrl))}" style="font-size:10px;color:${accent};text-decoration:none;font-weight:700;white-space:nowrap;">${safe(item.linkLabel || "Project Link")}</a>`
                      : ""
                  }
                </div>
                <p style="margin:4px 0 0;color:${text};font-size:11px;line-height:1.45;">${safe(item.description)}</p>
              </article>
            `
          )
          .join("")}
        </div>
      </section>
    `
    : "";

  const education = resume.education.length
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Education", accent)}
        <div style="margin-left:31mm;">
        ${resume.education
          .map(
            (item) => `
              <article style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;gap:12px;">
                  <div>
                    <h3 style="margin:0;font-size:12px;font-weight:700;">${safe(item.degree)}</h3>
                    <p style="margin:2px 0 0;color:${subtle};font-size:11px;">${safe(item.college)}</p>
                  </div>
                  <span style="font-size:10px;color:${subtle};white-space:nowrap;">${safe(item.year)}</span>
                </div>
                ${item.description ? `<p style="margin:4px 0 0;font-size:11px;line-height:1.45;">${safe(item.description)}</p>` : ""}
              </article>
            `
          )
          .join("")}
        </div>
      </section>
    `
    : "";

  const certifications = resume.certifications.length
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Certifications", accent)}
        <ul style="margin:0 0 0 31mm;padding-left:14px;font-size:11px;line-height:1.5;color:${text};">
          ${resume.certifications
            .map(
              (item) =>
                `<li>${
                  item.credentialUrl
                    ? `<a href="${safe(linkHref(item.credentialUrl))}"><strong>${safe(item.title)}</strong></a>`
                    : `<strong>${safe(item.title)}</strong>`
                }${item.issuer ? `, ${safe(item.issuer)}` : ""}${item.year ? ` (${safe(item.year)})` : ""}</li>`
            )
            .join("")}
        </ul>
      </section>
    `
    : "";

  const achievements = resume.achievements.length
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Achievements", accent)}
        <ul style="margin:0 0 0 31mm;padding-left:14px;font-size:11px;line-height:1.5;color:${text};">
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
        <section style="margin-top:8px;">
          ${sectionTitle(section.title || "Additional", accent)}
          <ul style="margin:0 0 0 31mm;padding-left:14px;font-size:11px;line-height:1.5;color:${text};">
            ${renderList(section.items)}
          </ul>
        </section>
      `
    )
    .join("");

  const summary = resume.summary
    ? `
      <section style="margin-top:8px;">
        ${sectionTitle("Summary", accent)}
        <p style="margin:0 0 0 31mm;color:${text};font-size:11px;line-height:1.45;">${safe(resume.summary)}</p>
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
          html, body {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Inter, Segoe UI, Arial, sans-serif;
            background: #ffffff;
            color: ${text};
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .document {
            width: 190mm;
            margin: 0 auto;
            background: ${background};
            padding: 0;
          }
          .document section,
          .document article,
          .document ul,
          .document p,
          .document h1,
          .document h2,
          .document h3,
          .document div,
          .document span,
          .document a {
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .section-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
          @media print {
            body { background: #ffffff; }
            .document { width: auto; margin: 0; }
          }
          a { color: ${accent}; }
        </style>
      </head>
      <body>
        <div class="document">
          <header style="display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;padding-bottom:12px;">
            ${
              resume.profilePhoto
                ? `<img src="${resume.profilePhoto}" alt="${safe(resume.name)}" style="height:84px;width:84px;border-radius:22px;object-fit:cover;border:3px solid ${surface};" />`
                : ""
            }
            <div style="width:100%;">
              <h1 style="margin:0;font-size:32px;line-height:1.1;">${safe(resume.name || "Full Name")}</h1>
              <p style="margin:8px 0 0;color:${subtle};font-size:14px;">${[resume.email, resume.phone].filter(Boolean).map(safe).join(" • ")}</p>
              ${socialLinks ? `<p style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:12px 0 0;color:${subtle};font-size:13px;line-height:1.7;">${socialLinks}</p>` : ""}
            </div>
          </header>
          <div class="section-block">${summary}</div>
          <div class="section-block">${skills}</div>
          <div class="section-block">${experience}</div>
          <div class="section-block">${projects}</div>
          <div class="section-block">${education}</div>
          <div class="section-block">${certifications}</div>
          <div class="section-block">${achievements}</div>
          <div class="section-block">${customSections}</div>
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

export const downloadResumePdf = async (
  resume: ResumeFormValues | ResumeRecord,
  filename: string
) => {
  const html = buildResumeHtml({ ...resume, themeMode: "light" });
  const template = document.createElement("template");
  template.innerHTML = html;
  const resumeDocument = template.content.querySelector<HTMLElement>(".document");

  if (!resumeDocument) {
    throw new Error("Unable to find resume document.");
  }

  await downloadResumeElementPdf(resumeDocument, filename);
};

const forceResumeElementLightTheme = (resumeElement: HTMLElement) => {
  const classReplacements = [
    ["bg-slate-950", "bg-white"],
    ["bg-slate-900/80", "bg-slate-50/70"],
    ["text-slate-100", "text-slate-900"],
    ["text-slate-400", "text-slate-500"],
    ["border-slate-800", "border-slate-200"],
  ] as const;
  const elements = [
    resumeElement,
    ...Array.from(resumeElement.querySelectorAll<HTMLElement>("*")),
  ];

  elements.forEach((element) => {
    classReplacements.forEach(([darkClass, lightClass]) => {
      if (element.classList.contains(darkClass)) {
        element.classList.replace(darkClass, lightClass);
      }
    });
  });

  resumeElement.querySelectorAll("svg").forEach((icon) => icon.remove());
  resumeElement.querySelectorAll<HTMLElement>("header span, header a").forEach((element) => {
    element.style.alignItems = "center";
    element.style.justifyContent = "center";
    element.style.whiteSpace = "nowrap";
    element.style.wordBreak = "normal";
    element.style.overflowWrap = "normal";
  });
  resumeElement.querySelectorAll<HTMLElement>("a").forEach((element) => {
    element.style.alignItems = "center";
    element.style.whiteSpace = "nowrap";
  });

  resumeElement.classList.add("bg-white", "text-slate-900");
  resumeElement.style.backgroundColor = "#ffffff";
  resumeElement.style.color = "#0f172a";
  resumeElement.style.borderColor = "#cbd5e1";
};

export const downloadResumeElementPdf = async (
  resumeElement: HTMLElement,
  filename: string
) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const captureRoot = document.createElement("div");
  const capturePage = resumeElement.cloneNode(true) as HTMLElement;
  forceResumeElementLightTheme(capturePage);

  captureRoot.style.position = "fixed";
  captureRoot.style.left = "-10000px";
  captureRoot.style.top = "0";
  captureRoot.style.width = "210mm";
  captureRoot.style.minHeight = "297mm";
  captureRoot.style.background = "#ffffff";
  captureRoot.style.pointerEvents = "none";
  captureRoot.style.zIndex = "-1";
  captureRoot.style.setProperty("--background", "0 0% 100%");
  captureRoot.style.setProperty("--foreground", "220 20% 12%");
  captureRoot.style.setProperty("--border", "214 32% 91%");

  capturePage.style.width = "210mm";
  capturePage.style.maxWidth = "none";
  capturePage.style.minHeight = "297mm";
  capturePage.style.margin = "0";
  capturePage.style.transform = "none";

  captureRoot.appendChild(capturePage);
  document.body.appendChild(captureRoot);

  try {
    await document.fonts?.ready;
    await Promise.all(
      Array.from(capturePage.querySelectorAll("img")).map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      })
    );

    const pageRect = capturePage.getBoundingClientRect();
    const linkRects = Array.from(capturePage.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .flatMap((anchor) => {
        const href = anchor.getAttribute("href") || "";
        if (!href || href === "#") return [];

        return Array.from(anchor.getClientRects()).map((rect) => ({
          url: linkHref(href),
          left: rect.left - pageRect.left,
          top: rect.top - pageRect.top,
          width: rect.width,
          height: rect.height,
        }));
      })
      .filter((rect) => rect.width > 0 && rect.height > 0);

    const canvas = await html2canvas(capturePage, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      windowWidth: capturePage.scrollWidth,
      windowHeight: Math.max(capturePage.scrollHeight, capturePage.offsetHeight),
    });

    const imageData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;
    const renderWidth = imageRatio > pageRatio ? pageWidth : pageHeight * imageRatio;
    const renderHeight = imageRatio > pageRatio ? pageWidth / imageRatio : pageHeight;
    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(imageData, "JPEG", offsetX, offsetY, renderWidth, renderHeight);
    linkRects.forEach((rect) => {
      pdf.link(
        offsetX + (rect.left / pageRect.width) * renderWidth,
        offsetY + (rect.top / pageRect.height) * renderHeight,
        (rect.width / pageRect.width) * renderWidth,
        (rect.height / pageRect.height) * renderHeight,
        { url: rect.url }
      );
    });

    pdf.save(filename);
  } finally {
    captureRoot.remove();
  }
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

export const createResumePdfFilename = (resume: Pick<ResumeSummary, "title">) =>
  `${resume.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "resume"}.pdf`;
