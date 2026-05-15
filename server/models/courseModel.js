import mongoose from "mongoose";

// Schema for individual syllabus modules
const syllabusModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  points: { type: [String], default: ["Hands-on exercises", "Mini-projects", "Quizzes & assessments", "Revision and Q&A"] }
}, { _id: false });

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
    // Support both old (string array) and new (module objects) formats for backward compatibility
    syllabus: { 
      type: mongoose.Schema.Types.Mixed,
      default: [],
      validate: {
        validator: function(v) {
          // Allow empty arrays
          if (!v || v.length === 0) return true;
          // Allow array of strings (old format)
          if (Array.isArray(v) && v.every(item => typeof item === 'string')) return true;
          // Allow array of module objects (new format)
          if (Array.isArray(v) && v.every(item => 
            typeof item === 'object' && 
            typeof item.title === 'string' && 
            Array.isArray(item.points)
          )) return true;
          return false;
        },
        message: 'Syllabus must be an array of strings or module objects'
      }
    },
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

  // Migrate old syllabus format to new format
  if (this.isModified("syllabus") && this.syllabus) {
    if (Array.isArray(this.syllabus) && this.syllabus.length > 0) {
      // Check if it's old format (array of strings)
      if (this.syllabus.every(item => typeof item === 'string')) {
        this.syllabus = this.syllabus.map(title => ({
          title: title.trim(),
          points: ["Hands-on exercises", "Mini-projects", "Quizzes & assessments", "Revision and Q&A"]
        }));
      }
    }
  }
  
  next();
});



const Course = mongoose.model("Course", courseSchema);

export default Course;
