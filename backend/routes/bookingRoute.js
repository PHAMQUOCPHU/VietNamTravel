import express from "express";
import {
  createBooking,
  getBookings,
  getAllBookings,
  updateBookingStatus,
  getAdminStats,
  requestCancelBooking,
  cancelExpiredBookingByUser,
  // Thêm các hàm mới liên quan đến Schedule (Lịch trình)
  getSchedulesByTour,
  createSchedule,
  deleteSchedule,
  getUserCollection,
} from "../controllers/bookingController.js";
import adminAuth from "../middlewares/adminAuth.js";
import authMiddleware from "../middlewares/auth.js";

const bookingRouter = express.Router();

// --- ROUTE DÀNH CHO ADMIN ---
bookingRouter.get("/stats", adminAuth, getAdminStats);
bookingRouter.get("/all", adminAuth, getAllBookings);
bookingRouter.post("/update-status", adminAuth, updateBookingStatus);

// Quản lý lịch trình (Admin thêm/xóa ngày khởi hành)
bookingRouter.post("/schedule", adminAuth, createSchedule);
bookingRouter.delete("/schedule/:id", adminAuth, deleteSchedule);

// --- ROUTE DÀNH CHO USER ---
// Lấy danh sách ngày khởi hành của 1 tour (Công khai, không cần đăng nhập)
bookingRouter.get("/schedules/:tourId", getSchedulesByTour);

// Đặt tour và quản lý đơn của User
bookingRouter.post("/", authMiddleware, createBooking);
bookingRouter.get("/", authMiddleware, getBookings);
// Thêm vào dưới dòng bookingRouter.get("/", authMiddleware, getBookings);
bookingRouter.get("/my-collection", authMiddleware, getUserCollection);
bookingRouter.post("/cancel", authMiddleware, requestCancelBooking);
bookingRouter.post("/cancel-expired", authMiddleware, cancelExpiredBookingByUser);

export default bookingRouter;
