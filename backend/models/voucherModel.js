import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      required: true,
      default: 0,
    },
    usageLimit: {
      type: Number,
      required: true,
      default: 100, // Số lần sử dụng tối đa
    },
    usedCount: {
      type: Number,
      default: 0, // Số lần đã sử dụng
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      }
    ],
    status: {
      type: String,
      enum: ["active", "expired", "exhausted"],
      default: "active",
    }
  },
  { timestamps: true }
);

const voucherModel = mongoose.models.voucher || mongoose.model("voucher", voucherSchema);
export default voucherModel;
