import mongoose, { Schema } from "mongoose";

const OfferSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "active", "expired"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

export const Offer = mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
