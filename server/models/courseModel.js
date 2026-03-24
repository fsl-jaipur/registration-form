import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    overview: { type: String, default: "" },
    duration: { type: String, default: "" },
    students: { type: String, default: "" },
    rating: { type: Number },
    level: { type: String, default: "" },
    tags: { type: [String], default: [] },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: "" },
    color: { type: String, default: "from-brand-blue to-brand-orange" },
    iconName: { type: String, default: "Layers" },
    fee: { type: String, default: "" },
    syllabus: { type: [String], default: [] },
    order: { type: Number },
  },
  { timestamps: true }
);

const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

courseSchema.pre("validate", function (next) {
  if (this.isModified("title") || this.isModified("slug")) {
    const base = this.slug || this.title;
    if (base) {
      this.slug = slugify(base);
    }
  }
  next();
});



const Course = mongoose.model("Course", courseSchema);

export default Course;
