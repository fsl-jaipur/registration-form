import mongoose from "mongoose";

const linkedInStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

const LinkedInState = mongoose.model("LinkedInState", linkedInStateSchema);
export default LinkedInState;
