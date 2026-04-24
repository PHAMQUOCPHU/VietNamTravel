import mongoose from "mongoose";
import { TOUR_CATEGORY_ENUM } from "../constants/tourCategories.js";

/** Tránh schema cũ (vd. field distance) bị giữ trong mongoose.models khi dev hot-reload */
if (process.env.NODE_ENV !== "production" && mongoose.models.tour) {
  delete mongoose.models.tour;
}

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    city: { type: String, required: true },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 3,
        message: "Tour phải có đúng 3 ảnh",
      },
    },
    desc: { type: String, required: true },
    itinerary: {
      type: [
        {
          dayTitle: { type: String, required: true },
          content: { type: String, required: true },
        },
      ],
      default: [],
    },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: 0 },
    maxGroupSize: { type: Number, required: true },
    joinedParticipants: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    availableDates: { type: [String], default: [] },

    // --- CẬP NHẬT MỚI: SỐ NGÀY DIỄN RA TOUR ---
    duration: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    }, // Ví dụ: 1 là đi trong ngày, 3 là tour 3 ngày 2 đêm

    category: {
      type: String,
      required: true,
      enum: TOUR_CATEGORY_ENUM,
    },
    region: {
      type: String,
      required: true,
      enum: ["Bắc", "Trung", "Nam"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    saleStartDate: {
      type: Date,
      default: null,
    },
    saleEndDate: {
      type: Date,
      default: null,
    },

    reviews: [
      {
        name: String,
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);
tourSchema.index({ isSale: 1, discountPercent: 1, updatedAt: -1 });
tourSchema.index({ isActive: 1, createdAt: -1 });

const tourModel = mongoose.models.tour || mongoose.model("tour", tourSchema);
export default tourModel;
