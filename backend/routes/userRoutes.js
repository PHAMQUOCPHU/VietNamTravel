import express from "express";
import {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  getProfile,
  getAllUsers,
  deleteUser,
  updateUserAdmin,
  getUserDetailAdmin,
  toggleFavorite,
  toggleSavedJob,
  getUserBookings, // 1. Thêm hàm này vào danh sách import
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/auth.js";
import adminAuth from "../middlewares/adminAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// --- 1. CÁC ROUTE PUBLIC (Không cần đăng nhập) ---
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/send-otp", sendOtp);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/verify-otp-forgot", verifyOtp);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

// --- 2. CÁC ROUTE CẦN ĐĂNG NHẬP (Sử dụng authMiddleware) ---
userRouter.get("/get-profile", authMiddleware, getProfile);

// 2. THÊM ROUTE NÀY: Fix lỗi 404 cho danh sách đơn hàng và tổng chi tiêu
userRouter.get("/bookings", authMiddleware, getUserBookings);

// Route xử lý yêu thích tour
userRouter.post("/toggle-favorite", authMiddleware, toggleFavorite);

userRouter.post("/toggle-saved-job", authMiddleware, toggleSavedJob);

userRouter.post("/change-password", authMiddleware, changePassword);

userRouter.post(
  "/update-profile",
  authMiddleware,
  upload.single("image"),
  updateProfile,
);

// --- 3. CÁC ROUTE ADMIN (bắt buộc JWT + role admin) ---
userRouter.get("/admin/users", adminAuth, getAllUsers);
userRouter.post("/admin/delete-user", adminAuth, deleteUser);
userRouter.post("/admin/update-user", adminAuth, updateUserAdmin);
// Đường dự phòng (cùng handler) — tránh 404 nếu client/proxy khác phiên bản
userRouter.post("/admin/users/update", adminAuth, updateUserAdmin);
userRouter.get("/admin/users/:id/detail", adminAuth, getUserDetailAdmin);

export default userRouter;
