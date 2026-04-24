import express from "express";
const paymentRouter = express.Router();
// Import cả 2 hàm: tạo thanh toán và xác thực thanh toán
import {
  createVnpayPayment,
  verifyVnpayPayment,
} from "../controllers/vnpayController.js";

// 1. Tuyến đường tạo link thanh toán (Phú đã làm)
paymentRouter.post("/vnpay", createVnpayPayment);

// 2. Tuyến đường xác thực kết quả trả về từ VNPay (Thêm mới)
// Hàm này sẽ giúp chuyển paymentStatus từ false sang true trong DB
paymentRouter.post("/vnpay-verify", verifyVnpayPayment);

export default paymentRouter;
