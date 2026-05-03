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
    default: "",
  },
  /** URL ảnh trên Cloudinary (tin nhắn có thể chỉ ảnh hoặc ảnh + chữ) */
  imageUrl: {
    type: String,
    default: "",
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

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, isRead: 1 });

const messageModel =
  mongoose.models.message || mongoose.model("message", messageSchema);
export default messageModel;
