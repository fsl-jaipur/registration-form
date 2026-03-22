import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    order: { type: Number },
  },
  { _id: true },
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    links: { type: [linkSchema], default: [] },
    order: { type: Number },
  },
  { _id: true },
);

const socialSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    order: { type: Number },
  },
  { _id: true },
);

const footerSchema = new mongoose.Schema(
  {
    logo: { type: String, default: "/images/logo.png", trim: true },
    description: {
      type: String,
      default:
        "FSL is Rajasthan's premier full stack development training institute, helping students launch successful tech careers since 2018.",
      trim: true,
    },
    ctaTitle: {
      type: String,
      default: "Ready to Start Your Tech Career?",
      trim: true,
    },
    ctaSubtitle: {
      type: String,
      default: "Join 5000+ students who transformed their lives with FSL",
      trim: true,
    },
    ctaButtonLabel: { type: String, default: "Enroll Now — It's Free to Enquire!", trim: true },
    ctaButtonHref: { type: String, default: "#enquiry", trim: true },
    sections: {
      type: [sectionSchema],
      default: [
        {
          title: "Quick Links",
          order: 0,
          links: [
            { label: "Home", href: "#home", order: 0 },
            { label: "About Us", href: "#about", order: 1 },
            { label: "Courses", href: "#courses", order: 2 },
            { label: "Placements", href: "#placements", order: 3 },
            { label: "Testimonials", href: "#testimonials", order: 4 },
            { label: "Contact", href: "#enquiry", order: 5 },
          ],
        },
        {
          title: "Our Courses",
          order: 1,
          links: [
            { label: "Full Stack Development", href: "#courses", order: 0 },
            { label: "Frontend Development", href: "#courses", order: 1 },
            { label: "Backend Development", href: "#courses", order: 2 },
            { label: "Database Management", href: "#courses", order: 3 },
            { label: "React Native", href: "#courses", order: 4 },
            { label: "DevOps & Cloud", href: "#courses", order: 5 },
          ],
        },
      ],
    },
    socials: {
      type: [socialSchema],
      default: [
        { label: "Facebook", href: "https://www.facebook.com/fullstacklearning", icon: "Facebook", order: 0 },
        { label: "Twitter", href: "#", icon: "X", order: 1 },
        { label: "Instagram", href: "https://instagram.com/fullstacklearning1", icon: "Instagram", order: 2 },
        { label: "LinkedIn", href: "https://www.linkedin.com/company/fullstacklearning/", icon: "Linkedin", order: 3 },
        { label: "YouTube", href: "https://www.youtube.com/@fullstacklearning", icon: "Youtube", order: 4 },
      ],
    },
    contact: {
      phone: { type: String, default: "+91-8824453320", trim: true },
      email: { type: String, default: "rohit@fullstacklearning.com", trim: true },
      address: {
        type: String,
        default: "A-20, Murtikala Colony, Tonk Road\nJaipur, Rajasthan 302018",
        trim: true,
      },
      mapLink: { type: String, default: "https://maps.app.goo.gl/xbjzCRCa8NAS9YoDA", trim: true },
    },
    bottomLinks: {
      type: [linkSchema],
      default: [
        { label: "Privacy Policy", href: "/privacy-policy", order: 0 },
        { label: "Terms of Service", href: "/terms-of-service", order: 1 },
        { label: "Sitemap", href: "/sitemap", order: 2 },
      ],
    },
  },
  { timestamps: true },
);

const Footer = mongoose.model("Footer", footerSchema);

export default Footer;
