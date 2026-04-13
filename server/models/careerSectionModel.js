import mongoose from "mongoose";

export const defaultCareerHighlights = [
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
];

export const defaultCareerOpenings = [
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
];

export const defaultCareerBenefits = [
  "Work with students who are actively building their careers in tech.",
  "Teach and ship practical projects instead of only theory-heavy sessions.",
  "Grow in a close-knit team where your ideas shape the learning experience.",
  "Contribute directly to outcomes like confidence, portfolios, and placements.",
];

export const defaultCareerHiringSteps = [
  "Share your resume and a short note about your experience.",
  "We review your profile and reach out for an introductory conversation.",
  "Shortlisted candidates complete a discussion or practical round.",
  "Selected applicants receive the final offer and onboarding plan.",
];

const orderedItem = {
  order: { type: Number },
};

const highlightCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: "BriefcaseBusiness" },
    accent: { type: String, trim: true, default: "brand-blue" },
    ...orderedItem,
  },
  { _id: true },
);

const openingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    ...orderedItem,
  },
  { _id: true },
);

const careerSectionSchema = new mongoose.Schema(
  {
    heroBadge: { type: String, trim: true, default: "Careers at FSL" },
    heroTitle: { type: String, trim: true, default: "Build careers while helping others" },
    heroHighlight: { type: String, trim: true, default: "build theirs." },
    heroDescription: {
      type: String,
      trim: true,
      default:
        "We are looking for people who care about practical learning, strong student outcomes, and the kind of teaching that changes confidence as much as it changes skills.",
    },
    applyButtonLabel: { type: String, trim: true, default: "Apply Now" },
    rolesButtonLabel: { type: String, trim: true, default: "View Open Roles" },
    roleSectionBadge: { type: String, trim: true, default: "Open Roles" },
    roleSectionTitle: { type: String, trim: true, default: "Current opportunities at FSL" },
    roleSectionDescription: {
      type: String,
      trim: true,
      default: "If one of these feels close to your background, we would love to hear from you.",
    },
    highlightCards: {
      type: [highlightCardSchema],
      default: () => defaultCareerHighlights.map((item) => ({ ...item })),
    },
    openings: {
      type: [openingSchema],
      default: () => defaultCareerOpenings.map((item) => ({ ...item })),
    },
    benefitsTitle: { type: String, trim: true, default: "Why join us" },
    benefits: {
      type: [String],
      default: () => [...defaultCareerBenefits],
    },
    hiringStepsTitle: { type: String, trim: true, default: "Our hiring process" },
    hiringSteps: {
      type: [String],
      default: () => [...defaultCareerHiringSteps],
    },
    ctaEyebrow: { type: String, trim: true, default: "Let's connect" },
    ctaTitle: { type: String, trim: true, default: "Don't see the perfect role?" },
    ctaDescription: {
      type: String,
      trim: true,
      default:
        "If you believe you can contribute to teaching, student success, operations, or placements, send us your profile anyway. Strong people create strong teams.",
    },
    ctaEmailLabel: { type: String, trim: true, default: "Send Application" },
    ctaEmailAddress: { type: String, trim: true, default: "rohit@fullstacklearning.com" },
    ctaEmailSubject: { type: String, trim: true, default: "Job Application" },
    ctaEmailBody: {
      type: String,
      trim: true,
      default: "Hello, I would like to apply.",
    },
    ctaPhoneLabel: { type: String, trim: true, default: "Call +91-8824453320" },
    ctaPhoneNumber: { type: String, trim: true, default: "+91-8824453320" },
    modalTitle: { type: String, trim: true, default: "Apply for Career" },
    modalDescription: {
      type: String,
      trim: true,
      default: "Fill in your details and upload your resume as a PDF.",
    },
    resumeHelperText: {
      type: String,
      trim: true,
      default: "Only PDF files are allowed. Image files are not accepted.",
    },
    submitButtonLabel: { type: String, trim: true, default: "Submit Application" },
    cancelButtonLabel: { type: String, trim: true, default: "Cancel" },
  },
  { timestamps: true },
);

const CareerSection = mongoose.model("CareerSection", careerSectionSchema);

export default CareerSection;
