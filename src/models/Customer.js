import mongoose, { Schema } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    city: { type: String, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    dob: { type: Date }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

