import mongoose from "mongoose";

const lifeAtFslSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const LifeAtFslImage = mongoose.model("LifeAtFslImage", lifeAtFslSchema);

export default LifeAtFslImage;
