import mongoose from "mongoose";

const surveyOptionEnum = ["Tệ", "Hài lòng", "Rất hài lòng"];

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tour",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: true,
      unique: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    survey: {
      guide: {
        type: String,
        enum: surveyOptionEnum,
        required: true,
      },
      transport: {
        type: String,
        enum: surveyOptionEnum,
        required: true,
      },
      food: {
        type: String,
        enum: surveyOptionEnum,
        required: true,
      },
      schedule: {
        type: String,
        enum: surveyOptionEnum,
        required: true,
      },
    },
  },
  { timestamps: true },
);

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;
