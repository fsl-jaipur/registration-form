import crypto from "crypto";
import slugify from "slugify";
import studentModel from "../models/studentModel.js";
import resumeModel from "../models/resumeModel.js";

const DEFAULT_SECTION_ORDER = [
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "achievements",
  "customSections",
];

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const uniqueStrings = (values = []) =>
  values
    .map((value) => cleanString(value))
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);

const sanitizeSocialLinks = (items = []) =>
  items
    .map((item) => ({
      label: cleanString(item?.label),
      url: cleanString(item?.url),
    }))
    .filter((item) => item.label || item.url);

const sanitizeProjects = (items = []) =>
  items
    .map((item) => ({
      title: cleanString(item?.title),
      description: cleanString(item?.description),
      techStack: uniqueStrings(Array.isArray(item?.techStack) ? item.techStack : []),
      linkLabel: cleanString(item?.linkLabel),
      linkUrl: cleanString(item?.linkUrl),
    }))
    .filter((item) => item.title || item.description || item.techStack.length || item.linkUrl);

const sanitizeExperience = (items = []) =>
  items
    .map((item) => ({
      company: cleanString(item?.company),
      role: cleanString(item?.role),
      duration: cleanString(item?.duration),
      description: cleanString(item?.description),
    }))
    .filter((item) => item.company || item.role || item.duration || item.description);

const sanitizeEducation = (items = []) =>
  items
    .map((item) => ({
      degree: cleanString(item?.degree),
      college: cleanString(item?.college),
      year: cleanString(item?.year),
      description: cleanString(item?.description),
    }))
    .filter((item) => item.degree || item.college || item.year || item.description);

const sanitizeCertifications = (items = []) =>
  items
    .map((item) => ({
      title: cleanString(item?.title),
      issuer: cleanString(item?.issuer),
      year: cleanString(item?.year),
      credentialUrl: cleanString(item?.credentialUrl),
    }))
    .filter((item) => item.title || item.issuer || item.year || item.credentialUrl);

const sanitizeAchievements = (items = []) =>
  items
    .map((item) => ({
      title: cleanString(item?.title),
      description: cleanString(item?.description),
    }))
    .filter((item) => item.title || item.description);

const sanitizeCustomSections = (items = []) =>
  items
    .map((item) => ({
      title: cleanString(item?.title),
      items: uniqueStrings(Array.isArray(item?.items) ? item.items : []),
    }))
    .filter((item) => item.title || item.items.length);

const normalizeSectionOrder = (items = []) => {
  const combined = uniqueStrings([
    ...items,
    ...DEFAULT_SECTION_ORDER,
  ]);
  return combined;
};

const buildResumePayload = (input = {}, fallbackUser = null) => {
  const fallbackName = cleanString(fallbackUser?.name);
  const fallbackEmail = cleanString(fallbackUser?.email).toLowerCase();
  const name = cleanString(input.name) || fallbackName;
  const email = cleanString(input.email).toLowerCase() || fallbackEmail;

  return {
    name,
    email,
    phone: cleanString(input.phone) || cleanString(fallbackUser?.phone),
    ownerName: name,
    ownerEmail: email,
    title: cleanString(input.title) || `${name || "My"} Resume`,
    template: cleanString(input.template) || "executive",
    themeMode: input.themeMode === "dark" ? "dark" : "light",
    accentColor: cleanString(input.accentColor) || "#0f766e",
    summary: cleanString(input.summary),
    profilePhoto: cleanString(input.profilePhoto),
    socialLinks: sanitizeSocialLinks(input.socialLinks),
    skills: uniqueStrings(Array.isArray(input.skills) ? input.skills : []),
    projects: sanitizeProjects(input.projects),
    experience: sanitizeExperience(input.experience),
    education: sanitizeEducation(input.education),
    certifications: sanitizeCertifications(input.certifications),
    achievements: sanitizeAchievements(input.achievements),
    customSections: sanitizeCustomSections(input.customSections),
    linkedInImport: {
      profileUrl: cleanString(input.linkedInImport?.profileUrl),
      importSource: cleanString(input.linkedInImport?.importSource),
      lastImportedAt: input.linkedInImport?.lastImportedAt
        ? new Date(input.linkedInImport.lastImportedAt)
        : undefined,
    },
    sectionOrder: normalizeSectionOrder(
      Array.isArray(input.sectionOrder) ? input.sectionOrder : []
    ),
    shared: Boolean(input.shared),
  };
};

const getAuthActor = (req) => {
  const token = req.firstTimeSignin || {};
  return {
    role: token.role,
    studentId: token.id || null,
    adminId: token.adminId || null,
    isAdmin: token.role === "admin",
  };
};

const ensureResumeAccess = (resume, actor) =>
  actor.isAdmin || String(resume.ownerId) === String(actor.studentId);

const toSummary = (resume) => ({
  _id: resume._id,
  name: resume.name,
  email: resume.email,
  phone: resume.phone,
  title: resume.title,
  template: resume.template,
  themeMode: resume.themeMode,
  accentColor: resume.accentColor,
  ownerName: resume.ownerName,
  ownerEmail: resume.ownerEmail,
  createdAt: resume.createdAt,
  updatedAt: resume.updatedAt,
  shared: resume.shared,
  shareSlug: resume.shareSlug,
});

const buildDefaultResume = (student) => ({
  title: `${student?.name || "My"} Resume`,
  name: student?.name || "",
  email: student?.email || "",
  phone: student?.phone || "",
  profilePhoto: "",
  summary:
    "Results-driven professional with a strong foundation in product execution, collaboration, and delivering measurable outcomes.",
  socialLinks: [
    { label: "LinkedIn", url: "" },
    { label: "GitHub", url: "" },
    { label: "Portfolio", url: "" },
  ],
  skills: ["JavaScript", "React", "Node.js", "Communication"],
  projects: [
    {
      title: "Portfolio Website",
      description:
        "Built a responsive portfolio with polished UI, project case studies, and contact flows.",
      techStack: ["React", "TypeScript", "Tailwind CSS"],
      linkLabel: "Live Demo",
      linkUrl: "",
    },
  ],
  experience: [
    {
      company: "Your Company",
      role: "Frontend Developer",
      duration: "2023 - Present",
      description:
        "Delivered modern product experiences, collaborated with cross-functional teams, and improved conversion through iterative UI work.",
    },
  ],
  education: [
    {
      degree: "B.Tech in Computer Science",
      college: student?.college || "Your College",
      year: "2024",
      description: "",
    },
  ],
  certifications: [],
  achievements: [],
  customSections: [],
  linkedInImport: {
    profileUrl: "",
    importSource: "",
  },
  sectionOrder: DEFAULT_SECTION_ORDER,
  template: "executive",
  themeMode: "light",
  accentColor: "#0f766e",
  shared: false,
});

const parseSections = (text) => {
  const headings = [
    "summary",
    "about",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "achievements",
    "honors",
    "awards",
  ];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = {};
  let current = "header";
  sections[current] = [];

  for (const line of lines) {
    const normalized = line.toLowerCase();
    if (headings.includes(normalized)) {
      current = normalized;
      sections[current] = [];
      continue;
    }
    sections[current] = sections[current] || [];
    sections[current].push(line);
  }

  return sections;
};

const groupLines = (items = [], chunkSize = 3) => {
  const groups = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    groups.push(items.slice(index, index + chunkSize));
  }
  return groups;
};

const extractLinkedInData = (text, profileUrl = "") => {
  const sections = parseSections(text);
  const header = sections.header || [];
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){10,15}/);
  const skillsText = [...(sections.skills || []), ...(sections.projects || [])].join(" ");
  const skillMatches = skillsText
    .split(/[|,•]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 1 && value.length < 40);

  const summary =
    [...(sections.summary || []), ...(sections.about || [])].join(" ").trim() || "";

  const experience = groupLines(sections.experience || [], 3).map((group) => ({
    role: group[0] || "",
    company: group[1] || "",
    duration: group[2] || "",
    description: "",
  }));

  const education = groupLines(sections.education || [], 3).map((group) => ({
    degree: group[0] || "",
    college: group[1] || "",
    year: group[2] || "",
    description: "",
  }));

  const certifications = groupLines(sections.certifications || [], 2).map((group) => ({
    title: group[0] || "",
    issuer: group[1] || "",
    year: "",
    credentialUrl: "",
  }));

  const achievements = [
    ...(sections.achievements || []),
    ...(sections.honors || []),
    ...(sections.awards || []),
  ].map((item) => ({
    title: item,
    description: "",
  }));

  return {
    name: header[0] || "",
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    summary,
    skills: uniqueStrings(skillMatches).slice(0, 20),
    experience,
    education,
    certifications,
    achievements,
    linkedInImport: {
      profileUrl,
      importSource: "linkedin-pdf",
      lastImportedAt: new Date(),
    },
  };
};

const loadPdfParser = async () => {
  try {
    const module = await import("pdf-parse");
    return module.default || module;
  } catch (error) {
    throw new Error(
      "PDF import requires the server dependency `pdf-parse`. Run npm install in the server workspace."
    );
  }
};

const createShareSlug = (title) =>
  `${slugify(title || "resume", { lower: true, strict: true })}-${crypto
    .randomBytes(3)
    .toString("hex")}`;

export async function getResumeBootstrap(req, res) {
  try {
    const actor = getAuthActor(req);
    const student = await studentModel.findById(actor.studentId).select("name email phone college");

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const resumes = await resumeModel
      .find({ ownerId: actor.studentId })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      student,
      resumes: resumes.map(toSummary),
      defaultResume: buildDefaultResume(student),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load resume workspace.",
      error: error.message,
    });
  }
}

export async function createResume(req, res) {
  try {
    const actor = getAuthActor(req);
    const student = await studentModel.findById(actor.studentId).select("name email phone college");

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const payload = buildResumePayload(
      Object.keys(req.body || {}).length ? req.body : buildDefaultResume(student),
      student
    );

    const shareSlug = payload.shared ? createShareSlug(payload.title) : undefined;
    const resume = await resumeModel.create({
      ownerId: actor.studentId,
      ...payload,
      shareSlug,
    });

    return res.status(201).json(resume);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create resume.",
      error: error.message,
    });
  }
}

export async function listMyResumes(req, res) {
  try {
    const actor = getAuthActor(req);
    const resumes = await resumeModel
      .find({ ownerId: actor.studentId })
      .sort({ updatedAt: -1 });

    return res.status(200).json(resumes.map(toSummary));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch resumes.",
      error: error.message,
    });
  }
}

export async function getResumeById(req, res) {
  try {
    const actor = getAuthActor(req);
    const resume = await resumeModel.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    if (!ensureResumeAccess(resume, actor)) {
      return res.status(403).json({ message: "You do not have access to this resume." });
    }

    return res.status(200).json(resume);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch resume.",
      error: error.message,
    });
  }
}

export async function updateResume(req, res) {
  try {
    const actor = getAuthActor(req);
    const resume = await resumeModel.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    if (!ensureResumeAccess(resume, actor)) {
      return res.status(403).json({ message: "You do not have access to update this resume." });
    }

    const student = !actor.isAdmin
      ? await studentModel.findById(actor.studentId).select("name email")
      : null;

    const payload = buildResumePayload(req.body, student);
    Object.assign(resume, payload);

    if (payload.shared && !resume.shareSlug) {
      resume.shareSlug = createShareSlug(payload.title);
    }

    if (!payload.shared) {
      resume.shareSlug = undefined;
    }

    await resume.save();
    return res.status(200).json(resume);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update resume.",
      error: error.message,
    });
  }
}

export async function deleteResume(req, res) {
  try {
    const actor = getAuthActor(req);
    const resume = await resumeModel.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    if (String(resume.ownerId) !== String(actor.studentId)) {
      return res.status(403).json({ message: "You do not have access to delete this resume." });
    }

    await resume.deleteOne();
    return res.status(200).json({ message: "Resume deleted successfully." });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete resume.",
      error: error.message,
    });
  }
}

export async function listAllResumes(req, res) {
  try {
    const resumes = await resumeModel.find().sort({ createdAt: -1 });
    return res.status(200).json(
      resumes.map((resume) => ({
        ...toSummary(resume),
        createdAt: resume.createdAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch admin resumes.",
      error: error.message,
    });
  }
}

export async function exportResumeJson(req, res) {
  try {
    const resume = await resumeModel.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found." });
    }

    res.setHeader("Content-Disposition", `attachment; filename=\"${slugify(resume.title, { lower: true, strict: true }) || "resume"}.json\"`);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(JSON.stringify(resume.toObject(), null, 2));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to export resume JSON.",
      error: error.message,
    });
  }
}

export async function importLinkedInPdf(req, res) {
  try {
    const file = req.file;
    const profileUrl = cleanString(req.body?.profileUrl);

    if (!file?.buffer) {
      return res.status(400).json({ message: "LinkedIn PDF is required." });
    }

    const pdfParse = await loadPdfParser();
    const result = await pdfParse(file.buffer);
    const extracted = extractLinkedInData(result.text || "", profileUrl);

    return res.status(200).json({
      message: "LinkedIn PDF parsed successfully.",
      data: extracted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to parse LinkedIn PDF.",
      error: error.message,
    });
  }
}

export async function getLinkedInAuthUrl(req, res) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(400).json({
      message: "LinkedIn OAuth is not configured on the server.",
    });
  }

  const state = crypto.randomBytes(12).toString("hex");
  res.cookie("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
  });

  return res.status(200).json({
    url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
  });
}

export async function linkedInCallback(req, res) {
  const { code, state } = req.query;
  const storedState = req.cookies.linkedin_oauth_state;
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const frontendUrl = process.env.FRONTEND_PATH || "http://localhost:8081";

  if (!code || !state || state !== storedState) {
    return res.redirect(
      `${frontendUrl}/resume-builder?linkedin=error&message=${encodeURIComponent("LinkedIn verification failed.")}`
    );
  }

  try {
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Unable to exchange LinkedIn authorization code.");
    }

    const tokenPayload = await tokenResponse.json();
    const accessToken = tokenPayload.access_token;
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error("Unable to fetch LinkedIn profile.");
    }

    const profile = await profileResponse.json();
    const payload = Buffer.from(
      JSON.stringify({
        name: [profile.given_name, profile.family_name].filter(Boolean).join(" "),
        email: profile.email || "",
        profilePhoto: profile.picture || "",
        linkedInImport: {
          profileUrl: profile.profile || "",
          importSource: "linkedin-oauth",
          lastImportedAt: new Date(),
        },
      })
    ).toString("base64url");

    res.clearCookie("linkedin_oauth_state", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.redirect(`${frontendUrl}/resume-builder?linkedin=success&payload=${payload}`);
  } catch (error) {
    return res.redirect(
      `${frontendUrl}/resume-builder?linkedin=error&message=${encodeURIComponent(error.message || "LinkedIn import failed.")}`
    );
  }
}

export async function getSharedResume(req, res) {
  try {
    const resume = await resumeModel.findOne({ shareSlug: req.params.slug, shared: true });
    if (!resume) {
      return res.status(404).json({ message: "Shared resume not found." });
    }
    return res.status(200).json(resume);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch shared resume.",
      error: error.message,
    });
  }
}
