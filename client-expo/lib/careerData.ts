import { createApiClient } from "@shared/api/client";
import { getApiBaseUrl } from "@shared/config/api";

export type CareerHighlightCard = {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  order?: number;
};

export type CareerOpening = {
  _id?: string;
  title: string;
  type: string;
  location: string;
  summary: string;
  order?: number;
};

export type CareerSectionData = {
  _id?: string;
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  applyButtonLabel: string;
  rolesButtonLabel: string;
  roleSectionBadge: string;
  roleSectionTitle: string;
  roleSectionDescription: string;
  highlightCards: CareerHighlightCard[];
  openings: CareerOpening[];
  benefitsTitle: string;
  benefits: string[];
  hiringStepsTitle: string;
  hiringSteps: string[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaEmailLabel: string;
  ctaEmailAddress: string;
  ctaEmailSubject: string;
  ctaEmailBody: string;
  ctaPhoneLabel: string;
  ctaPhoneNumber: string;
  modalTitle: string;
  modalDescription: string;
  resumeHelperText: string;
  submitButtonLabel: string;
  cancelButtonLabel: string;
};

const sortByOrder = <T extends { order?: number }>(items: T[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const fallbackCareerSection: CareerSectionData = {
  heroBadge: "Careers at FSL",
  heroTitle: "Build careers while helping others",
  heroHighlight: "build theirs.",
  heroDescription:
    "We are looking for people who care about practical learning, strong student outcomes, and the kind of teaching that changes confidence as much as it changes skills.",
  applyButtonLabel: "Apply Now",
  rolesButtonLabel: "View Open Roles",
  roleSectionBadge: "Open Roles",
  roleSectionTitle: "Current opportunities at FSL",
  roleSectionDescription: "If one of these feels close to your background, we would love to hear from you.",
  highlightCards: [
    {
      title: "Outcome-focused work",
      description: "Your work directly improves classes, projects, and student growth.",
      icon: "BriefcaseBusiness",
      accent: "brand-blue",
      order: 0,
    },
    {
      title: "Small team energy",
      description: "You will collaborate closely, move quickly, and have room to contribute ideas.",
      icon: "Users",
      accent: "brand-orange",
      order: 1,
    },
    {
      title: "Teach what matters now",
      description: "We care about modern tools, practical assignments, and career-ready skill building.",
      icon: "Clock3",
      accent: "brand-blue",
      order: 2,
    },
  ],
  openings: [
    {
      title: "Frontend Developer Mentor",
      type: "Full Time",
      location: "Jaipur / On-site",
      summary:
        "Guide learners through React, TypeScript, UI engineering, and portfolio-quality frontend projects.",
      order: 0,
    },
    {
      title: "Backend Developer Mentor",
      type: "Full Time",
      location: "Jaipur / On-site",
      summary:
        "Help students build strong API, database, and deployment skills using practical real-world assignments.",
      order: 1,
    },
    {
      title: "Student Success Executive",
      type: "Full Time",
      location: "Jaipur / On-site",
      summary:
        "Support learners from onboarding to placement readiness with clear communication and strong follow-through.",
      order: 2,
    },
  ],
  benefitsTitle: "Why join us",
  benefits: [
    "Work with students who are actively building their careers in tech.",
    "Teach and ship practical projects instead of only theory-heavy sessions.",
    "Grow in a close-knit team where your ideas shape the learning experience.",
    "Contribute directly to outcomes like confidence, portfolios, and placements.",
  ],
  hiringStepsTitle: "Our hiring process",
  hiringSteps: [
    "Share your resume and a short note about your experience.",
    "We review your profile and reach out for an introductory conversation.",
    "Shortlisted candidates complete a discussion or practical round.",
    "Selected applicants receive the final offer and onboarding plan.",
  ],
  ctaEyebrow: "Let's connect",
  ctaTitle: "Don't see the perfect role?",
  ctaDescription:
    "If you believe you can contribute to teaching, student success, operations, or placements, send us your profile anyway. Strong people create strong teams.",
  ctaEmailLabel: "Send Application",
  ctaEmailAddress: "rohit@fullstacklearning.com",
  ctaEmailSubject: "Job Application",
  ctaEmailBody: "Hello, I would like to apply.",
  ctaPhoneLabel: "Call +91-8824453320",
  ctaPhoneNumber: "+91-8824453320",
  modalTitle: "Apply for Career",
  modalDescription: "Fill in your details and upload your resume as a PDF, DOC, or DOCX file.",
  resumeHelperText: "PDF, DOC, and DOCX files are allowed up to 5MB.",
  submitButtonLabel: "Submit Application",
  cancelButtonLabel: "Cancel",
};

const normalizeText = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const uniqueTextList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const seen = new Set<string>();

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .filter((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

  return items.length ? items : fallback;
};

const normalizeHighlightCards = (value: unknown) => {
  if (!Array.isArray(value)) return fallbackCareerSection.highlightCards;

  const cards = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const card = item as Partial<CareerHighlightCard>;
      const fallback = fallbackCareerSection.highlightCards[index] || fallbackCareerSection.highlightCards[0];

      return {
        _id: typeof card._id === "string" ? card._id : undefined,
        title: normalizeText(card.title, fallback.title),
        description: normalizeText(card.description, fallback.description),
        icon: normalizeText(card.icon, fallback.icon),
        accent: normalizeText(card.accent, fallback.accent),
        order: typeof card.order === "number" ? card.order : index,
      };
    })
    .filter((item): item is CareerHighlightCard => Boolean(item));

  return cards.length ? cards : fallbackCareerSection.highlightCards;
};

const normalizeOpenings = (value: unknown) => {
  if (!Array.isArray(value)) return fallbackCareerSection.openings;

  const openings = value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const opening = item as Partial<CareerOpening>;
      const fallback = fallbackCareerSection.openings[index] || fallbackCareerSection.openings[0];

      return {
        _id: typeof opening._id === "string" ? opening._id : undefined,
        title: normalizeText(opening.title, fallback.title),
        type: normalizeText(opening.type, fallback.type),
        location: normalizeText(opening.location, fallback.location),
        summary: normalizeText(opening.summary, fallback.summary),
        order: typeof opening.order === "number" ? opening.order : index,
      };
    })
    .filter((item): item is CareerOpening => Boolean(item));

  return openings.length ? openings : fallbackCareerSection.openings;
};

export const normalizeCareerSection = (value: unknown): CareerSectionData => {
  const source = value && typeof value === "object" ? (value as Partial<CareerSectionData>) : {};

  return {
    _id: typeof source._id === "string" ? source._id : undefined,
    heroBadge: normalizeText(source.heroBadge, fallbackCareerSection.heroBadge),
    heroTitle: normalizeText(source.heroTitle, fallbackCareerSection.heroTitle),
    heroHighlight: normalizeText(source.heroHighlight, fallbackCareerSection.heroHighlight),
    heroDescription: normalizeText(source.heroDescription, fallbackCareerSection.heroDescription),
    applyButtonLabel: normalizeText(source.applyButtonLabel, fallbackCareerSection.applyButtonLabel),
    rolesButtonLabel: normalizeText(source.rolesButtonLabel, fallbackCareerSection.rolesButtonLabel),
    roleSectionBadge: normalizeText(source.roleSectionBadge, fallbackCareerSection.roleSectionBadge),
    roleSectionTitle: normalizeText(source.roleSectionTitle, fallbackCareerSection.roleSectionTitle),
    roleSectionDescription: normalizeText(
      source.roleSectionDescription,
      fallbackCareerSection.roleSectionDescription,
    ),
    highlightCards: sortByOrder(normalizeHighlightCards(source.highlightCards)),
    openings: sortByOrder(normalizeOpenings(source.openings)),
    benefitsTitle: normalizeText(source.benefitsTitle, fallbackCareerSection.benefitsTitle),
    benefits: uniqueTextList(source.benefits, fallbackCareerSection.benefits),
    hiringStepsTitle: normalizeText(source.hiringStepsTitle, fallbackCareerSection.hiringStepsTitle),
    hiringSteps: uniqueTextList(source.hiringSteps, fallbackCareerSection.hiringSteps),
    ctaEyebrow: normalizeText(source.ctaEyebrow, fallbackCareerSection.ctaEyebrow),
    ctaTitle: normalizeText(source.ctaTitle, fallbackCareerSection.ctaTitle),
    ctaDescription: normalizeText(source.ctaDescription, fallbackCareerSection.ctaDescription),
    ctaEmailLabel: normalizeText(source.ctaEmailLabel, fallbackCareerSection.ctaEmailLabel),
    ctaEmailAddress: normalizeText(source.ctaEmailAddress, fallbackCareerSection.ctaEmailAddress),
    ctaEmailSubject: normalizeText(source.ctaEmailSubject, fallbackCareerSection.ctaEmailSubject),
    ctaEmailBody: normalizeText(source.ctaEmailBody, fallbackCareerSection.ctaEmailBody),
    ctaPhoneLabel: normalizeText(source.ctaPhoneLabel, fallbackCareerSection.ctaPhoneLabel),
    ctaPhoneNumber: normalizeText(source.ctaPhoneNumber, fallbackCareerSection.ctaPhoneNumber),
    modalTitle: normalizeText(source.modalTitle, fallbackCareerSection.modalTitle),
    modalDescription: normalizeText(source.modalDescription, fallbackCareerSection.modalDescription),
    resumeHelperText: normalizeText(source.resumeHelperText, fallbackCareerSection.resumeHelperText),
    submitButtonLabel: normalizeText(source.submitButtonLabel, fallbackCareerSection.submitButtonLabel),
    cancelButtonLabel: normalizeText(source.cancelButtonLabel, fallbackCareerSection.cancelButtonLabel),
  };
};

export async function fetchCareerSection() {
  const apiBase = getApiBaseUrl();
  if (!apiBase) return fallbackCareerSection;

  const api = createApiClient(apiBase);
  const data = await api.requestJson<{ section?: Partial<CareerSectionData> | null }>("/api/career-section");
  return normalizeCareerSection(data?.section);
}

