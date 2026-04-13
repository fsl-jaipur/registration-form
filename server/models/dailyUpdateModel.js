import mongoose from "mongoose";

const dailyUpdateSchema = new mongoose.Schema(
  {
    authorRole: { type: String, required: true, trim: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    authorName: { type: String, default: "Unknown", trim: true },
    authorEmail: { type: String, default: "", trim: true },
    authorPhone: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1200 },
    trelloCardId: { type: String, default: null, trim: true },
    trelloCardUrl: { type: String, default: null, trim: true },
    trelloCardShortUrl: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
      trim: true,
    },
  },
  { timestamps: true },
);

const DailyUpdate = mongoose.model("DailyUpdate", dailyUpdateSchema);

export default DailyUpdate;
