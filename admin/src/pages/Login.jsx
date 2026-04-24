import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ShieldCheck } from "lucide-react";
import logo from "../assets/images/logo.png";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Lấy giá trị từ Context
  const { setAToken, backendUrl } = useContext(AdminContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/user/login`, {
        email,
        password,
        adminLogin: true,
        userCaptcha: "",
        serverCaptcha: "",
      });

      if (response.data.success) {
        const { token, user } = response.data;

        if (user.role !== "admin") {
          toast.error("Bạn không có quyền quản trị viên");
          setLoading(false);
          return;
        }

        // Lưu Token và cập nhật trạng thái toàn cục
        localStorage.setItem("adminToken", token);
        setAToken(token);

        toast.success("Chào mừng Admin quay trở lại!");
        navigate("/admin");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Lỗi kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-100/50 p-8 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4 shadow-inner">
            <img
              src={logo}
              alt="VN Travel"
              className="w-16 h-12 object-cover rounded-md shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            Quản Trị Viên <span className="text-blue-600">VN Travel</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Email quản trị
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vietnamtravel.com"
                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              Mật khẩu
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className={`w-full ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"} text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-[16px]`}
          >
            {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
