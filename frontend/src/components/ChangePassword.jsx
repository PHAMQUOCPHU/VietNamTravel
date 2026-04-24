import React, { useState } from "react";
import { X, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const ChangePassword = ({ isOpen, onClose }) => {
  const { handleChangePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!oldPassword) return alert("Vui lòng nhập mật khẩu hiện tại!");
    if (newPassword.length < 6) return alert("Mật khẩu mới phải từ 6 ký tự!");
    if (newPassword !== confirmPassword)
      return alert("Xác nhận mật khẩu không khớp!");

    const success = await handleChangePassword(oldPassword, newPassword);
    if (success) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-blue-600">
            <Lock size={20} />
            <h2 className="font-bold text-lg">Đổi mật khẩu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all"
          >
            Cập nhật mật khẩu
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm hover:underline"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
