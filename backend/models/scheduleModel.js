import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tour", // Phải khớp với tên model Tour của Phú
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    maxGroupSize: {
      type: Number,
      required: true,
    },
    joinedParticipants: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const scheduleModel =
  mongoose.models.schedule || mongoose.model("schedule", scheduleSchema);
export default scheduleModel;
