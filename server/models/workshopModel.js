import mongoose from "mongoose";

const workshopSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    certificateEnabled: {
      type: Boolean,
      default: false,
    },
    date: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const workshopModel = mongoose.model("Workshop", workshopSchema);

export default workshopModel;
