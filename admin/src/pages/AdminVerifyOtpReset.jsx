import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";

const AdminVerifyOtpReset = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { backendUrl } = useContext(AdminContext);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate("/admin/forgot-password", { replace: true });
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    const clean = otp.trim();
    if (clean.length < 6) {
      toast.info("Nhập đủ 6 ký tự OTP.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/verify-otp-forgot`,
        { email, otp: clean },
      );
      if (data?.success) {
        toast.success("Xác thực OTP thành công.");
        navigate("/admin/reset-password", { state: { email }, replace: true });
      } else {
        toast.error(data?.message || "Mã OTP không hợp lệ.");
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
          to="/admin/forgot-password"
          state={{ email }}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Đổi email / gửi lại OTP
        </Link>

        <div className="mb-6 flex justify-center rounded-2xl bg-blue-50 p-4">
          <ShieldCheck className="h-14 w-14 text-blue-600" aria-hidden />
        </div>

        <h1 className="text-center text-2xl font-extrabold text-gray-800">
          Nhập mã OTP
        </h1>
        <p className="mt-2 text-center text-sm font-medium text-gray-500">
          Đã gửi đến{" "}
          <span className="break-all font-semibold text-blue-600">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="text"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\s+/g, "").toUpperCase())
            }
            placeholder="______"
            maxLength={6}
            autoComplete="one-time-code"
            className="w-full border-b-2 border-blue-500 pb-2 text-center text-3xl font-bold uppercase tracking-[0.6em] outline-none transition-colors focus:border-blue-700"
            required
          />
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
            {loading ? "Đang xác thực..." : "Tiếp tục"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminVerifyOtpReset;
