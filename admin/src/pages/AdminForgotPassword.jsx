import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { backendUrl } = useContext(AdminContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const em = String(email || "").trim();
    if (!em) {
      toast.info("Vui lòng nhập email.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin/forgot-password`,
        { email: em },
      );
      if (data?.success) {
        toast.success(data.message || "Đã xử lý yêu cầu.");
        navigate("/admin/verify-otp-reset", { state: { email: em } });
      } else {
        toast.error(data?.message || "Không gửi được yêu cầu.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err?.message || "Lỗi kết nối máy chủ.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-blue-100/50"
      >
        <Link
          to="/admin/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Quay lại đăng nhập
        </Link>

        <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
          Quên mật khẩu <span className="text-blue-600">Admin</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Nhập email quản trị. Nếu khớp tài khoản admin, bạn nhận mã OTP để đặt lại mật
          khẩu.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500">
              Email quản trị
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-blue-600">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className={`w-full rounded-2xl py-4 text-[16px] font-bold text-white shadow-lg transition-all ${
              loading
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminForgotPassword;
