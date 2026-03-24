import mongoose from "mongoose";

const getInTouchSchema = new mongoose.Schema(
  {
    badgeText: { type: String, default: "Get In Touch", trim: true },
    heading: { type: String, default: "Start Your", trim: true },
    highlight: { type: String, default: "Learning Journey", trim: true },
    description: {
      type: String,
      default: "Fill out the form and our counselors will get back to you within 24 hours",
      trim: true,
    },
    phone: { type: String, default: "+91-8824453320", trim: true },
    email: { type: String, default: "rohit@fullstacklearning.com", trim: true },
    mapLink: {
      type: String,
      default: "https://maps.app.goo.gl/xbjzCRCa8NAS9YoDA",
      trim: true,
    },
    courses: {
      type: [String],
      default: [
        "Full Stack Development",
        "Frontend Development",
        "Backend Development",
        "Database Management",
        "React Native Mobile",
        "DevOps & Cloud",
      ],
    },
    highlights: {
      type: [String],
      default: [
        "100% Placement Assistance",
        "Industry Expert Mentors",
        "Live Project Training",
        "Flexible Batch Timings",
        "EMI Options Available",
      ],
    },
    formEndpoint: { type: String, default: "https://api.web3forms.com/submit", trim: true },
    accessKey: { type: String, default: "9896dc59-07e4-4630-9b2d-39348c63866c", trim: true },
  },
  { timestamps: true },
);

const GetInTouch = mongoose.model("GetInTouch", getInTouchSchema);

export default GetInTouch;
