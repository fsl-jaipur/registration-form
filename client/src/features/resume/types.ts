export type SocialLink = {
  label: string;
  url: string;
};

export type ResumeProject = {
  title: string;
  description: string;
  techStack: string[];
  linkLabel: string;
  linkUrl: string;
};

export type ResumeExperience = {
  company: string;
  role: string;
  duration: string;
  description: string;
};

export type ResumeEducation = {
  degree: string;
  college: string;
  year: string;
  description: string;
};

export type ResumeCertification = {
  title: string;
  issuer: string;
  year: string;
  credentialUrl: string;
};

export type ResumeAchievement = {
  title: string;
  description: string;
};

export type ResumeCustomSection = {
  title: string;
  items: string[];
};

export type ResumeLinkedInImport = {
  profileUrl: string;
  importSource: string;
  lastImportedAt?: string;
};

export type ResumeThemeMode = "light" | "dark";
export type ResumeTemplateId = "executive" | "timeline" | "minimal";

export type ResumeFormValues = {
  title: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string;
  summary: string;
  socialLinks: SocialLink[];
  skills: string[];
  projects: ResumeProject[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  achievements: ResumeAchievement[];
  customSections: ResumeCustomSection[];
  linkedInImport: ResumeLinkedInImport;
  sectionOrder: string[];
  template: ResumeTemplateId;
  themeMode: ResumeThemeMode;
  accentColor: string;
  shared: boolean;
};

export type ResumeRecord = ResumeFormValues & {
  _id: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
  shareSlug?: string;
};

export type ResumeSummary = Pick<
  ResumeRecord,
  | "_id"
  | "title"
  | "template"
  | "themeMode"
  | "accentColor"
  | "ownerName"
  | "ownerEmail"
  | "createdAt"
  | "updatedAt"
  | "shared"
  | "shareSlug"
>;

export type ResumeBootstrapResponse = {
  student: {
    name: string;
    email: string;
    phone?: string;
    college?: string;
  };
  resumes: ResumeSummary[];
  defaultResume: ResumeFormValues;
};

export type ResumeSuggestion = {
  id: string;
  title: string;
  description: string;
};
