import mongoose from "mongoose";

export const defaultHeroImages = [
  {
    url: "https://placehold.co/1600x900?text=Hero+Image+1",
    alt: "Hero background 1",
    order: 0,
  },
  {
    url: "https://placehold.co/1600x900?text=Hero+Image+2",
    alt: "Hero background 2",
    order: 1,
  },
];

export const defaultHeroWords = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Engineer",
  "Web Developer",
];

export const defaultHeroButtons = [
  { label: "Join Now", href: "#enquiry", style: "primary", icon: "ArrowRight", order: 0 },
  { label: "Explore Courses", href: "#courses", style: "outline", icon: "Play", order: 1 },
];

export const defaultHeroStats = [
  { label: "Students Trained", value: 5000, suffix: "+", icon: "Users", order: 0 },
  { label: "Courses", value: 15, suffix: "+", icon: "BookOpen", order: 1 },
  { label: "Placements", value: 2500, suffix: "+", icon: "Award", order: 2 },
  { label: "Avg Salary Hike", value: 85, suffix: "%", icon: "TrendingUp", order: 3 },
];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, default: "" },
    order: { type: Number },
  },
  { _id: true },
);

const buttonSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    style: {
      type: String,
      enum: ["primary", "secondary", "outline", "ghost"],
      default: "primary",
    },
    icon: { type: String, trim: true, default: "" },
    order: { type: Number },
    isExternal: { type: Boolean, default: false },
  },
  { _id: true },
);

const statSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    suffix: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "" },
    order: { type: Number },
  },
  { _id: true },
);

const heroSectionSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      default: "#1 Learning Platform in Rajasthan",
      trim: true,
    },
    title: { type: String, default: "Become A", trim: true },
    highlightPrefix: { type: String, default: "in just", trim: true },
    highlightNumber: { type: Number, default: 6 },
    highlightSuffix: { type: String, default: "Months", trim: true },
    description: {
      type: String,
      default: "That's all the time it takes.. Join 5000+ students who transformed their careers!",
      trim: true,
    },
    animatedWords: {
      type: [String],
      default: () => defaultHeroWords.map((word) => word),
    },
    buttons: {
      type: [buttonSchema],
      default: () => defaultHeroButtons.map((btn) => ({ ...btn })),
    },
    stats: {
      type: [statSchema],
      default: () => defaultHeroStats.map((stat) => ({ ...stat })),
    },
    images: {
      type: [imageSchema],
      default: () => defaultHeroImages.map((img) => ({ ...img })),
    },
    scrollText: { type: String, default: "Scroll", trim: true },
    showScrollIndicator: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const HeroSection = mongoose.model("HeroSection", heroSectionSchema);

export default HeroSection;
