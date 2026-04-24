import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const { state } = useLocation();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);

  useEffect(() => {
    if (!state?.email) {
      navigate("/login");
    }
  }, [state, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      // 1. CHUẨN HÓA MÃ OTP (Xóa khoảng trắng)
      const cleanOtp = otp.trim();

      // 2. PHÂN LUỒNG XỬ LÝ
      if (state?.name) {
        // LUỒNG ĐĂNG KÝ: Gọi api/user/verify-otp
        const { data } = await axios.post(`${backendUrl}/api/user/verify-otp`, {
          email: state.email,
          otp: cleanOtp,
          name: state.name,
          phone: state.phone,
          password: state.password,
        });

        if (data.success) {
          toast.success("Đăng ký thành công! Hãy đăng nhập.");
          navigate("/login");
        } else {
          toast.error(data.message);
        }
      } else {
        // LUỒNG QUÊN MẬT KHẨU: Gọi api/user/verify-otp-forgot (Phải khớp với routes/userRoutes.js)
        const { data } = await axios.post(
          `${backendUrl}/api/user/verify-otp-forgot`,
          {
            email: state.email,
            otp: cleanOtp,
          },
        );

        if (data.success) {
          toast.success("Xác thực thành công!");
          // Chuyển hướng sang trang Reset Password kèm thông tin email
          navigate("/reset-password", { state: { email: state.email } });
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Xác thực OTP</h2>
        <p className="text-gray-500 mb-6">
          Mã đã được gửi đến{" "}
          <span className="font-semibold text-blue-600">{state?.email}</span>
        </p>
        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase())} // Tự động viết hoa để dễ nhìn
            placeholder="MÃ OTP"
            className="w-full text-center text-3xl tracking-[10px] font-bold border-b-2 border-blue-500 outline-none pb-2 focus:border-blue-700 transition-all uppercase"
            maxLength={6}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            Xác nhận mã
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
