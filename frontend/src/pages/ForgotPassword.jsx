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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Quên mật khẩu</h2>

        {/* Thông báo cảnh báo */}
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
          <p className="text-amber-800 text-sm font-semibold mb-2">
            ⚠️ Lưu ý quan trọng:
          </p>
          <ul className="text-amber-700 text-xs space-y-1 list-disc list-inside">
            <li>
              Vui lòng nhấn nút{" "}
              <span className="font-bold">1 lần duy nhất</span>
            </li>
            <li>Chờ hệ thống gửi mã xác thực (OTP)</li>
            <li>
              Tránh nhấn nhiều lần, nếu không hệ thống sẽ gửi mã hàng loạt vào
              Email
            </li>
          </ul>
        </div>

        <input
          type="email"
          placeholder="Nhập Email của bạn"
          className="w-full border p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <button
          className={`w-full py-3 rounded-lg font-bold transition-all duration-200 ${
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
