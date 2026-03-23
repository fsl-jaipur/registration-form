import mongoose from "mongoose";

export const defaultNavItems = [
  { label: "Home", href: "#home", order: 0, isExternal: false },
  { label: "About", href: "#about", order: 1, isExternal: false },
  { label: "Courses", href: "#courses", order: 2, isExternal: false },
  { label: "Placements", href: "#placements", order: 3, isExternal: false },
  { label: "Testimonials", href: "#testimonials", order: 4, isExternal: false },
  { label: "Life at FSL", href: "/lifeatfsl", order: 5, isExternal: false },
  { label: "Career", href: "/career", order: 6, isExternal: false },
  { label: "Contact", href: "#enquiry", order: 7, isExternal: false },
];

export const defaultButtons = [
  { label: "Enroll Now", href: "/register", style: "primary", order: 0 },
  { label: "Login", href: "/login", style: "outline", order: 1 },
];

const navItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    order: { type: Number },
    isExternal: { type: Boolean, default: false },
  },
  { _id: true },
);

const buttonSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    style: {
      type: String,
      enum: ["primary", "secondary", "outline"],
      default: "primary",
    },
    order: { type: Number },
  },
  { _id: true },
);

const universalHeaderSchema = new mongoose.Schema(
  {
    logo: { type: String, default: "/images/logo.png", trim: true },
    logoAlt: { type: String, default: "FullStack Learning", trim: true },
    navItems: {
      type: [navItemSchema],
      default: () => defaultNavItems.map((item) => ({ ...item })),
    },
    buttons: {
      type: [buttonSchema],
      default: () => defaultButtons.map((item) => ({ ...item })),
    },
  },
  { timestamps: true },
);

const UniversalHeader = mongoose.model("UniversalHeader", universalHeaderSchema);

export default UniversalHeader;
