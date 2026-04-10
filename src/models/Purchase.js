import mongoose, { Schema } from "mongoose";

const PurchaseSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    mobileModel: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    pointsEarned: { type: Number, required: true },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    purchaseDate: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);

export const Purchase =
  mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);

