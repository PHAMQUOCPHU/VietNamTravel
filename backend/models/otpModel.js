//Tạo Model lưu OTP (backend/models/otpModel.js)
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // Tự động xóa sau 5 phút (300 giây)
});

const otpModel = mongoose.models.otp || mongoose.model("otp", otpSchema);
export default otpModel;