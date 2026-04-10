import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "owner" }
  },
  {
    timestamps: true
  }
);

export const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
