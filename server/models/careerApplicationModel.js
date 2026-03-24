import { Schema, model } from "mongoose";

const careerApplicationSchema = new Schema(
  {
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    candidateEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    resumeOriginalName: {
      type: String,
      required: true,
      trim: true,
    },
    resumeMimeType: {
      type: String,
      required: true,
      trim: true,
    },
    resumeSize: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const careerApplicationModel = model("careerApplication", careerApplicationSchema);

export default careerApplicationModel;
