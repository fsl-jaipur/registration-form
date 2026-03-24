import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 140,
    },
    videoLink: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "uncategorized",
    },
    thumbnail: {
      type: String,
      default: null,
      trim: true,
    },
    trelloCardId: {
      type: String,
      default: null,
      trim: true,
    },
    trelloCardUrl: {
      type: String,
      default: null,
      trim: true,
    },
    trelloCardShortUrl: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
