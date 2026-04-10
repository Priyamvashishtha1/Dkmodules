import mongoose, { Schema } from "mongoose";

const WalletSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true
    },
    totalPoints: { type: Number, default: 0 },
    redeemedPoints: { type: Number, default: 0 },
    remainingPoints: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

export const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", WalletSchema);
