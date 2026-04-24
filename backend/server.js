import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

// Models
import messageModel from "./models/messageModel.js";
import userModel from "./models/userModel.js";

// Routers
import userRouter from "./routes/userRoutes.js";
import bookingRouter from "./routes/bookingRoute.js";
import captchaRouter from "./routes/captchaRoute.js";
import tourRouter from "./routes/tourRoute.js";
import blogRouter from "./routes/blogRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import { startPaymentDeadlineCron } from "./services/paymentDeadlineCron.js";
import { startDepartureReminderCron } from "./services/departureReminderCron.js";
import { setSocketIO } from "./services/socketRegistry.js";
import notificationRouter from "./routes/notificationRoute.js";
import adminNotificationRouter from "./routes/adminNotificationRoute.js";
import insuranceLeadRouter from "./routes/insuranceLeadRoute.js";
import geminiTourAdvisorRouter from "./routes/geminiTourAdvisorRoute.js";

const PORT = process.env.PORT || 5001;
const app = express();

// --- 1. CẤU HÌNH NGUỒN CHO PHÉP (Dùng chung cho cả CORS và Socket) ---
// Cùng cổng 5173/5174/3000; trình duyệt có thể dùng localhost hoặc 127.0.0.1 — CORS coi là hai origin khác nhau.
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",
  "https://viet-nam-travel.vercel.app",
];

// --- 2. CẤU HÌNH HTTP SERVER & SOCKET.IO ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// LƯU IO VÀO APP ĐỂ DÙNG TRONG CONTROLLER
app.set("socketio", io);
setSocketIO(io);

// --- 3. MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy không cho phép nguồn này"));
      }
    },
    credentials: true,
  }),
);

const enableRequestLog =
  process.env.ENABLE_HTTP_REQUEST_LOG === "true" ||
  process.env.NODE_ENV !== "production";
if (enableRequestLog) {
  app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - [${req.method}] ${req.url}`);
    next();
  });
}

// --- 4. API CHAT ---
app.get("/api/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: "ADMIN" },
          { senderId: "ADMIN", receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get("/api/messages/admin/users", async (req, res) => {
  try {
    const conversations = await messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: "ADMIN" }, { receiverId: "ADMIN" }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", "ADMIN"] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", "ADMIN"] },
                    { $ne: ["$senderId", "ADMIN"] },
                    {
                      $or: [
                        { $eq: ["$isRead", false] },
                        { $eq: [{ $type: "$isRead" }, "missing"] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    const userIds = conversations
      .map((item) => item._id)
      .filter((id) => typeof id === "string" && id.length === 24);
    const userDetails = await userModel
      .find({ _id: { $in: userIds } })
      .select("name email image");
    const userMap = new Map(
      userDetails.map((user) => [String(user._id), user]),
    );

    const users = conversations.map((item) => {
      const user = userMap.get(item._id);
      return {
        _id: item._id,
        name: user?.name || "Khách hàng",
        email: user?.email || "",
        image: user?.image || "",
        lastMessage: item.lastMessage || "",
        lastMessageAt: item.lastMessageAt || null,
        unreadCount: item.unreadCount || 0,
      };
    });

    res.json({ success: true, users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get("/api/messages/admin/unread-count", async (req, res) => {
  try {
    const unreadCount = await messageModel.countDocuments({
      receiverId: "ADMIN",
      senderId: { $ne: "ADMIN" },
      $or: [{ isRead: false }, { isRead: { $exists: false } }],
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post("/api/messages/admin/mark-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await messageModel.updateMany(
      {
        senderId: userId,
        receiverId: "ADMIN",
        $or: [{ isRead: false }, { isRead: { $exists: false } }],
      },
      { $set: { isRead: true } },
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get("/api/messages/user/unread-count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadCount = await messageModel.countDocuments({
      senderId: "ADMIN",
      receiverId: userId,
      $or: [{ isRead: false }, { isRead: { $exists: false } }],
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post("/api/messages/user/mark-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await messageModel.updateMany(
      {
        senderId: "ADMIN",
        receiverId: userId,
        $or: [{ isRead: false }, { isRead: { $exists: false } }],
      },
      { $set: { isRead: true } },
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// --- 5. LOGIC SOCKET.IO ---
io.on("connection", (socket) => {
  console.log("⚡ Kết nối mới:", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`👤 Phòng chat hoạt động: ${userId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, message } = data;
      const newMessage = new messageModel({
        senderId,
        receiverId,
        message,
        isRead: false,
      });
      await newMessage.save();
      const targetRoom = receiverId === "ADMIN" ? senderId : receiverId;
      io.to(targetRoom).emit("receive_message", {
        ...data,
        _id: newMessage._id,
        createdAt: newMessage.createdAt,
        isRead: newMessage.isRead,
      });
    } catch (error) {
      console.log("❌ Lỗi socket:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Một người đã thoát chat");
  });
});

// --- 6. ROUTES & DATABASE ---
connectCloudinary();
connectDB(); // Gọi kết nối DB luôn ở đây cho gọn
startPaymentDeadlineCron();
startDepartureReminderCron();

app.use("/api/user/captcha", captchaRouter);
app.use("/api/user", userRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/tour", tourRouter);
app.use("/api/tours", tourRouter);
app.use("/api/blog", blogRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/admin/notifications", adminNotificationRouter);
app.use("/api/insurance-leads", insuranceLeadRouter);
app.use("/api", geminiTourAdvisorRouter);

app.get("/", (req, res) => {
  res.send("API VietNam Travel is Working!");
});

// DÙNG httpServer.listen ĐỂ CHẠY CẢ APP VÀ SOCKET
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server chạy ổn định tại: http://localhost:${PORT}`);
});
