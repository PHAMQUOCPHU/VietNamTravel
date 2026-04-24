import express from "express";
import messageModel from "../models/messageModel.js";

const messageRouter = express.Router();

// Lấy tin nhắn giữa Admin và một khách hàng cụ thể
messageRouter.get("/get-messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Tìm tất cả tin nhắn mà (người gửi là user này VÀ người nhận là admin)
    // HOẶC (người gửi là admin VÀ người nhận là user này)
    const messages = await messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: "ADMIN_ID_FIXED" },
          { senderId: "ADMIN_ID_FIXED", receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 }); // Sắp xếp theo thời gian tăng dần

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

export default messageRouter;
