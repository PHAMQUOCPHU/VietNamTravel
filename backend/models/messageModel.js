import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  // Đổi từ mongoose.Schema.Types.ObjectId sang String
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const messageModel =
  mongoose.models.message || mongoose.model("message", messageSchema);
export default messageModel;
