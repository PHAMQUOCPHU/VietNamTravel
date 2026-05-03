import express from "express";
import cors from "cors";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminAuth from "./middlewares/adminAuth.js";
import authMiddleware from "./middlewares/auth.js";
import {
  allowAdminOrThreadUser,
  requireUserMatchesParam,
} from "./middlewares/messageAccess.js";
import {
  uploadBufferToCloudinary,
  CLOUDINARY_FOLDERS,
} from "./services/cloudinaryUpload.js";

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
import voucherRouter from "./routes/voucherRoute.js";
import diaryRouter from "./routes/diaryRoute.js";
import safetyRouter from "./routes/safetyRoute.js";
import jobApplicationRouter from "./routes/jobApplicationRoute.js";
import jobRouter from "./routes/jobRoute.js";
import termsRouter from "./routes/termsRoute.js";

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

/** Phòng Socket để SPA admin nhận tin khách gửi tới ADMIN (không cần mở từng thread). */
const STAFF_ADMIN_CHAT_ROOM = "vn_staff_admin_chat";

const CHAT_HISTORY_LIMIT = Number(
  process.env.CHAT_HISTORY_LIMIT || 500,
);

const chatImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("CHỈ_CHO_PHEP_ANH"));
    }
  },
});

// --- 4. API CHAT ---
app.get("/api/messages/:userId", allowAdminOrThreadUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: "ADMIN" },
          { senderId: "ADMIN", receiverId: userId },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(CHAT_HISTORY_LIMIT)
      .lean();
    messages.reverse();
    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get("/api/messages/admin/users", adminAuth, async (req, res) => {
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
          lastImageUrl: { $first: "$imageUrl" },
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
        lastMessage: item.lastImageUrl
          ? item.lastMessage?.trim()
            ? `📷 ${item.lastMessage}`
            : "📷 Ảnh"
          : item.lastMessage || "",
        lastMessageAt: item.lastMessageAt || null,
        unreadCount: item.unreadCount || 0,
      };
    });

    res.json({ success: true, users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post(
  "/api/messages/chat-image/admin",
  adminAuth,
  chatImageUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file?.buffer) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu file ảnh" });
      }
      const imageUrl = await uploadBufferToCloudinary(
        req.file,
        CLOUDINARY_FOLDERS.chat,
      );
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error("chat-image admin:", error);
      res.status(500).json({
        success: false,
        message:
          error.message === "CHỈ_CHO_PHEP_ANH"
            ? "Chỉ được tải file ảnh"
            : error.message || "Upload thất bại",
      });
    }
  },
);

app.post(
  "/api/messages/chat-image/user",
  authMiddleware,
  chatImageUpload.single("image"),
  async (req, res) => {
    try {
      if (!req.file?.buffer) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu file ảnh" });
      }
      const imageUrl = await uploadBufferToCloudinary(
        req.file,
        CLOUDINARY_FOLDERS.chat,
      );
      res.json({ success: true, imageUrl });
    } catch (error) {
      console.error("chat-image user:", error);
      res.status(500).json({
        success: false,
        message:
          error.message === "CHỈ_CHO_PHEP_ANH"
            ? "Chỉ được tải file ảnh"
            : error.message || "Upload thất bại",
      });
    }
  },
);

app.get("/api/messages/admin/unread-count", adminAuth, async (req, res) => {
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

app.post("/api/messages/admin/mark-read/:userId", adminAuth, async (req, res) => {
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

app.get(
  "/api/messages/user/unread-count/:userId",
  authMiddleware,
  requireUserMatchesParam,
  async (req, res) => {
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
  },
);

app.post(
  "/api/messages/user/mark-read/:userId",
  authMiddleware,
  requireUserMatchesParam,
  async (req, res) => {
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
  },
);

// --- 5. LOGIC SOCKET.IO ---
io.on("connection", (socket) => {
  console.log("⚡ Kết nối mới:", socket.id);

  socket.on("join_room", (userId) => {
    if (userId) socket.join(userId);
    console.log(`👤 Phòng chat hoạt động: ${userId}`);
  });

  socket.on("leave_room", (userId) => {
    if (userId) socket.leave(userId);
  });

  socket.on("join_staff_admin_chat", (payload) => {
    try {
      const raw =
        payload && typeof payload === "object"
          ? payload.atoken || payload.token
          : null;
      if (!raw || !process.env.JWT_SECRET) return;
      const decoded = jwt.verify(raw, process.env.JWT_SECRET);
      if (decoded.role !== "admin") return;
      socket.join(STAFF_ADMIN_CHAT_ROOM);
    } catch {
      /* token sai / hết hạn — không join */
    }
  });

  socket.on("leave_staff_admin_chat", () => {
    socket.leave(STAFF_ADMIN_CHAT_ROOM);
  });

  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, message, imageUrl } = data;
      const text = typeof message === "string" ? message.trim() : "";
      const img =
        typeof imageUrl === "string" ? imageUrl.trim().slice(0, 2000) : "";
      if (!text && !img) return;

      const newMessage = new messageModel({
        senderId,
        receiverId,
        message: text,
        imageUrl: img,
        isRead: false,
      });
      await newMessage.save();
      const targetRoom = receiverId === "ADMIN" ? senderId : receiverId;
      const payload = {
        senderId,
        receiverId,
        message: newMessage.message,
        imageUrl: newMessage.imageUrl || "",
        _id: newMessage._id,
        createdAt: newMessage.createdAt,
        isRead: newMessage.isRead,
      };
      io.to(targetRoom).emit("receive_message", payload);
      if (receiverId === "ADMIN") {
        io.to(STAFF_ADMIN_CHAT_ROOM).emit("receive_message", payload);
      }
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
app.use("/api/vouchers", voucherRouter);
app.use("/api/diaries", diaryRouter);
app.use("/api/safety", safetyRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/job-applications", jobApplicationRouter);
app.use("/api/terms", termsRouter);
app.use("/api", geminiTourAdvisorRouter);

app.get("/", (req, res) => {
  res.send("API VietNam Travel is Working!");
});

async function start() {
  try {
    await connectDB();
    startPaymentDeadlineCron();
    startDepartureReminderCron();

    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `\nCổng ${PORT} đang bị chiếm (thường là bản server.js chạy trước đó).`,
        );
        console.error(
          `Gợi ý: lsof -nP -iTCP:${PORT} -sTCP:LISTEN  →  kill <PID>`,
        );
        console.error(`Hoặc đặt PORT khác trong file .env\n`);
        process.exit(1);
        return;
      }
      throw err;
    });

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server chạy ổn định tại: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Không khởi động được server:", err.message);
    process.exit(1);
  }
}

start();
