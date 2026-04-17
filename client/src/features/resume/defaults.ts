import type {
  ResumeAchievement,
  ResumeCertification,
  ResumeCustomSection,
  ResumeEducation,
  ResumeExperience,
  ResumeFormValues,
  ResumeProject,
  SocialLink,
} from "./types";

export const resumeTemplates = [
  {
    id: "executive",
    label: "Executive",
    description: "Balanced and professional for general roles.",
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Experience-forward layout with strong career storytelling.",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Clean compact layout for modern one-page resumes.",
  },
] as const;

export const themeColors = [
  "#0f766e",
  "#1d4ed8",
  "#9333ea",
  "#be123c",
  "#c2410c",
  "#111827",
] as const;

export const defaultSocialLink = (): SocialLink => ({
  label: "",
  url: "",
});

export const defaultProject = (): ResumeProject => ({
  title: "",
  description: "",
  techStack: [],
  linkLabel: "",
  linkUrl: "",
});

export const defaultExperience = (): ResumeExperience => ({
  company: "",
  role: "",
  duration: "",
  description: "",
});

export const defaultEducation = (): ResumeEducation => ({
  degree: "",
  college: "",
  year: "",
  description: "",
});

export const defaultCertification = (): ResumeCertification => ({
  title: "",
  issuer: "",
  year: "",
  credentialUrl: "",
});

export const defaultAchievement = (): ResumeAchievement => ({
  title: "",
  description: "",
});

export const defaultCustomSection = (): ResumeCustomSection => ({
  title: "Custom Section",
  items: [""],
});

export const defaultResumeValues = (): ResumeFormValues => ({
  title: "My Resume",
  name: "",
  email: "",
  phone: "",
  profilePhoto: "",
  summary: "",
  socialLinks: [
    { label: "LinkedIn", url: "" },
    { label: "GitHub", url: "" },
    { label: "Portfolio", url: "" },
  ],
  skills: [],
  projects: [],
  experience: [],
  education: [],
  certifications: [],
  achievements: [],
  customSections: [],
  linkedInImport: {
    profileUrl: "",
    importSource: "",
  },
  sectionOrder: [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "customSections",
  ],
  template: "executive",
  themeMode: "light",
  accentColor: "#0f766e",
  shared: false,
});
