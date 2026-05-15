import mongoose from "mongoose";

const placedStudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

const PlacedStudent = mongoose.model("PlacedStudent", placedStudentSchema);

export default PlacedStudent;
