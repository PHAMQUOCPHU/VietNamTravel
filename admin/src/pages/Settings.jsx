import { motion } from "framer-motion";
import {
  Save,
  Globe,
  Bell,
  ShieldCheck,
  Palette,
  Phone,
  Mail,
} from "lucide-react";

const Settings = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
        <p className="text-sm text-gray-500 font-medium">
          Tùy chỉnh cấu hình website VN Travel của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Menu bên trái */}
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-100 transition-all">
            Chung
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all">
            Thông báo
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all">
            Bảo mật
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all">
            Giao diện
          </button>
        </div>

        {/* Nội dung bên phải */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8 space-y-8">
          {/* Section 1: Thông tin Website */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <Globe size={18} className="text-blue-600" /> Thông tin Website
            </h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tên dự án
                </label>
                <input
                  type="text"
                  defaultValue="VietNam Travel"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Email hỗ trợ
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="email"
                    defaultValue="quocphupham@vntravel.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Hotline
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    defaultValue="0987 654 321"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Bảo mật cơ bản */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <ShieldCheck size={18} className="text-emerald-600" /> Quyền hạn
              Admin
            </h3>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Chế độ bảo trì
                </p>
                <p className="text-[11px] text-emerald-600">
                  Chỉ Admin mới có thể truy cập website
                </p>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
              </div>
            </div>
          </div>

          {/* Nút lưu */}
          <button className="w-full py-4 bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg shadow-slate-200 hover:bg-black flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]">
            <Save size={20} /> Lưu tất cả thay đổi
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
