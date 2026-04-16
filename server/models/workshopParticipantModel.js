import mongoose from "mongoose";

const workshopParticipantSchema = new mongoose.Schema(
  {
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workshop",
      required: true,
    },
    enrollmentId: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    otpHash: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Each enrollment ID is unique within a workshop
workshopParticipantSchema.index({ workshopId: 1, enrollmentId: 1 }, { unique: true });
// Each email is unique within a workshop
workshopParticipantSchema.index({ workshopId: 1, email: 1 }, { unique: true });

const workshopParticipantModel = mongoose.model(
  "WorkshopParticipant",
  workshopParticipantSchema
);

export default workshopParticipantModel;
