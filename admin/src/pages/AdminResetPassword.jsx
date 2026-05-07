import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";

const AdminResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { backendUrl } = useContext(AdminContext);

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate("/admin/forgot-password", { replace: true });
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    const a = String(pwd || "");
    const b = String(pwd2 || "");
    if (a.length < 6) {
      toast.error("Mật khẩu mới ít nhất 6 ký tự.");
      return;
    }
    if (a !== b) {
      toast.error("Nhập lại mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/reset-password`, {
        email,
        newPassword: a,
      });
      if (data?.success) {
        toast.success(data.message || "Đã đặt lại mật khẩu. Đăng nhập với mật khẩu mới.");
        navigate("/admin/login", { replace: true });
      } else {
        toast.error(data?.message || "Không đặt lại được.");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err?.message || "Lỗi kết nối máy chủ.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-blue-100/50"
      >
        <Link
          to="/admin/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Đến đăng nhập
        </Link>

        <div className="mb-6 flex justify-center rounded-2xl bg-emerald-50 p-4">
          <KeyRound className="h-12 w-12 text-emerald-600" aria-hidden />
        </div>

        <h1 className="text-center text-2xl font-extrabold text-gray-800">
          Đặt lại mật khẩu
        </h1>
        <p className="mt-2 text-center text-sm font-medium text-gray-500">
          Tài khoản{" "}
          <span className="break-all font-semibold text-gray-700">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500">
              Mật khẩu mới
            </label>
            <div className="group relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600"
              />
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500">
              Nhập lại mật khẩu
            </label>
            <div className="group relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600"
              />
              <input
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder="Khớp với ô trên"
                autoComplete="new-password"
                className="block w-full rounded-2xl border border-gray-100 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
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
                : "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminResetPassword;
