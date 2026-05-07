import React, { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { resetPasswordRequest } from "../services/authService";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const { state } = useLocation();
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const data = await resetPasswordRequest({
        backendUrl,
        email: state.email,
        newPassword,
      });
      if (data.success) {
        toast.success("Đã đổi mật khẩu thành công!");
        navigate("/login");
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleReset} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Đặt lại mật khẩu</h2>
        <input
          type="password"
          placeholder="Mật khẩu mới"
          className="w-full border p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Cập nhật</button>
      </form>
    </div>
  );
};

export default ResetPassword;