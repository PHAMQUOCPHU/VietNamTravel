import { motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";
import { Wrench, UserRound, AtSign, PhoneCall } from "lucide-react";

const DEFAULT_MAINTENANCE = {
  enabled: false,
  title: "Đang bảo trì hệ thống",
  message: "Trang web đang cập nhật, vui lòng quay lại sau.",
  contact: {
    name: "Mr Phú",
    phone: "0905713702",
    email: "phamquocphu431027@gmail.com",
  },
};

const MaintenanceSettings = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(DEFAULT_MAINTENANCE.enabled);
  const [title, setTitle] = useState(DEFAULT_MAINTENANCE.title);
  const [message, setMessage] = useState(DEFAULT_MAINTENANCE.message);
  const [contact, setContact] = useState({ ...DEFAULT_MAINTENANCE.contact });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/site-config/public`);
        if (!mounted) return;
        const m = data?.maintenance || {};
        setEnabled(Boolean(m?.enabled));
        setTitle(typeof m?.title === "string" && m.title.trim() ? m.title.trim() : DEFAULT_MAINTENANCE.title);
        setMessage(
          typeof m?.message === "string" && m.message.trim()
            ? m.message.trim()
            : DEFAULT_MAINTENANCE.message,
        );
        const c = m?.contact || {};
        setContact({
          name: typeof c?.name === "string" && c.name.trim() ? c.name.trim() : DEFAULT_MAINTENANCE.contact.name,
          phone: typeof c?.phone === "string" && c.phone.trim() ? c.phone.trim() : DEFAULT_MAINTENANCE.contact.phone,
          email: typeof c?.email === "string" && c.email.trim() ? c.email.trim() : DEFAULT_MAINTENANCE.contact.email,
        });
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [backendUrl]);

  const save = async (nextEnabled = enabled) => {
    if (!aToken) {
      toast.error("Bạn chưa đăng nhập admin");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/site-config/maintenance`,
        {
          enabled: Boolean(nextEnabled),
          title,
          message,
          contact,
        },
        { headers: { atoken: aToken } },
      );
      if (data?.success) {
        setEnabled(Boolean(data?.maintenance?.enabled));
        toast.success(data.message || "Đã cập nhật bảo trì");
      } else {
        toast.error(data?.message || "Không thể cập nhật bảo trì");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể cập nhật bảo trì");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Chế độ bảo trì</h1>
        <p className="text-sm text-gray-500 font-medium">
          Khi bật, người dùng vào website sẽ thấy giao diện bảo trì và thông báo cập nhật.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              <Wrench size={18} className="text-slate-800" />
              Trạng thái bảo trì
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Bật/tắt bảo trì và lưu nội dung hiển thị cho người dùng.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(!enabled)}
            className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-extrabold border transition ${
              enabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            } ${saving ? "opacity-70 cursor-not-allowed" : "hover:opacity-95"}`}
          >
            {enabled ? "Đang bật" : "Đang tắt"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Tiêu đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Thông báo
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-extrabold text-gray-700 mb-3 flex items-center gap-2">
            <UserRound size={16} /> Card liên hệ
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Tên
              </label>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                SĐT
              </label>
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700"
              />
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-white p-4 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Preview card
            </p>
            <div className="mt-2 rounded-2xl border border-gray-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-fuchsia-50 p-4">
              <p className="text-sm font-extrabold text-gray-800">{contact.name}</p>
              <div className="mt-3 space-y-2 text-sm font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <PhoneCall size={16} className="text-sky-600" />
                  {contact.phone}
                </div>
                <div className="flex items-center gap-2">
                  <AtSign size={16} className="text-fuchsia-600" />
                  {contact.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => save(enabled)}
          className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-extrabold text-white shadow-lg shadow-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-black"
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình bảo trì"}
        </button>
      </div>
    </motion.div>
  );
};

export default MaintenanceSettings;

