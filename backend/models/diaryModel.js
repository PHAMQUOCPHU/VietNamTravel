import mongoose from "mongoose";

const diarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: true,
      unique: true, // 1 booking = 1 diary
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tour",
      required: true,
    },
    tourTitle: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    rating: { type: Number, min: 1, max: 5, default: 5 },
    emotion: { type: String, enum: ["Tuyệt vời", "Vui vẻ", "Ấn tượng", "Bình thường", "Thất vọng"], default: "Tuyệt vời" },
    location: { type: String },
    travelDate: { type: Date }
  },
  { timestamps: true }
);

const diaryModel = mongoose.models.diary || mongoose.model("diary", diarySchema);

export default diaryModel;
