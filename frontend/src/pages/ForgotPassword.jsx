import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Ngăn gửi multiple requests

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/forgot-password`,
        { email },
      );
      if (response.data.success) {
        toast.success("Mã OTP đã được gửi!");
        navigate("/verify-otp", { state: { email } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Email không tồn tại");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg w-full max-w-md p-5 sm:p-8"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
          Quên mật khẩu
        </h2>

        {/* Thông báo cảnh báo */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
          <p className="text-amber-800 text-xs sm:text-sm font-semibold mb-2">
            ⚠️ Lưu ý quan trọng:
          </p>
          <ul className="text-amber-700 text-xs space-y-1 list-disc list-inside">
            <li>
              Vui lòng nhấn nút{" "}
              <span className="font-bold">1 lần duy nhất</span>
            </li>
            <li>Chờ hệ thống gửi mã xác thực (OTP)</li>
            <li>Tránh nhấn nhiều lần để không nhận mã hàng loạt</li>
          </ul>
        </div>

        <div className="space-y-1 mb-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            placeholder="Nhập Email của bạn"
            className="w-full border px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <button
          className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 ${
            isLoading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Đang gửi mã..." : "Gửi yêu cầu"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
