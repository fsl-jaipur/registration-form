import mongoose, { Schema, model } from "mongoose";

const socialLinkSchema = new Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    techStack: [{ type: String, trim: true }],
    linkLabel: { type: String, trim: true },
    linkUrl: { type: String, trim: true },
  },
  { _id: false }
);

const experienceSchema = new Schema(
  {
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    duration: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    degree: { type: String, trim: true },
    college: { type: String, trim: true },
    year: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const certificationSchema = new Schema(
  {
    title: { type: String, trim: true },
    issuer: { type: String, trim: true },
    year: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
  },
  { _id: false }
);

const achievementSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const customSectionSchema = new Schema(
  {
    title: { type: String, trim: true },
    items: [{ type: String, trim: true }],
  },
  { _id: false }
);

const linkedInImportSchema = new Schema(
  {
    profileUrl: { type: String, trim: true },
    importSource: { type: String, trim: true },
    lastImportedAt: Date,
  },
  { _id: false }
);

const resumeSchema = new Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
      index: true,
    },
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    ownerName: { type: String, trim: true, default: "" },
    ownerEmail: { type: String, trim: true, lowercase: true, default: "" },
    title: { type: String, trim: true, required: true },
    slug: { type: String, trim: true, unique: true, sparse: true },
    template: { type: String, trim: true, default: "executive" },
    themeMode: { type: String, enum: ["light", "dark"], default: "light" },
    accentColor: { type: String, trim: true, default: "#0f766e" },
    summary: { type: String, trim: true, default: "" },
    profilePhoto: { type: String, trim: true, default: "" },
    socialLinks: [socialLinkSchema],
    skills: [{ type: String, trim: true }],
    projects: [projectSchema],
    experience: [experienceSchema],
    education: [educationSchema],
    certifications: [certificationSchema],
    achievements: [achievementSchema],
    customSections: [customSectionSchema],
    linkedInImport: linkedInImportSchema,
    sectionOrder: [{ type: String, trim: true }],
    shared: { type: Boolean, default: false },
    shareSlug: { type: String, trim: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

const resumeModel = model("resume", resumeSchema);
export default resumeModel;
