import { motion } from "framer-motion";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";
import {
  Wrench,
  UserRound,
  AtSign,
  PhoneCall,
  Power,
  Loader2,
} from "lucide-react";

const DEFAULT_MAINTENANCE = {
  enabled: false,
  title: "Đang bảo trì hệ thống",
  message: "Trang web đang cập nhật, vui lòng quay lại sau.",
  expectedTime: "Hoàn thành trong vài giờ tới",
  contact: {
    name: "Mr Phú",
    phone: "0905713702",
    email: "phamquocphu431027@gmail.com",
  },
};

const MaintenanceSettings = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [enabled, setEnabled] = useState(DEFAULT_MAINTENANCE.enabled);
  const [title, setTitle] = useState(DEFAULT_MAINTENANCE.title);
  const [message, setMessage] = useState(DEFAULT_MAINTENANCE.message);
  const [expectedTime, setExpectedTime] = useState(DEFAULT_MAINTENANCE.expectedTime);
  const [contact, setContact] = useState({ ...DEFAULT_MAINTENANCE.contact });

  /** Bỏ qua lần chạy autosave đầu sau khi tải xong dữ liệu từ máy chủ */
  const skipFieldAutosaveRef = useRef(true);

  const getPayload = useCallback(
    (nextEnabled) => ({
      enabled: Boolean(nextEnabled),
      title,
      message,
      expectedTime,
      contact,
    }),
    [contact, expectedTime, message, title],
  );

  const savingRef = useRef(false);
  const save = useCallback(
    async (nextEnabled, opts = {}) => {
      const { silent = false } = opts;
      if (!aToken) {
        if (!silent) toast.error("Bạn chưa đăng nhập admin");
        return false;
      }
      if (savingRef.current) return false;
      savingRef.current = true;
      setSaving(true);
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/site-config/maintenance`,
          getPayload(nextEnabled),
          { headers: { atoken: aToken } },
        );
        if (data?.success) {
          setEnabled(Boolean(data?.maintenance?.enabled));
          if (!silent) {
            toast.success(data.message || "Đã cập nhật bảo trì");
          }
          return true;
        }
        toast.error(data?.message || "Không thể cập nhật bảo trì");
        return false;
      } catch (err) {
        toast.error(err?.response?.data?.message || "Không thể cập nhật bảo trì");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [aToken, backendUrl, getPayload],
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setPageLoading(true);
      skipFieldAutosaveRef.current = true;
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
        setExpectedTime(
          typeof m?.expectedTime === "string"
            ? m.expectedTime.trim()
            : DEFAULT_MAINTENANCE.expectedTime,
        );
        const c = m?.contact || {};
        setContact({
          name: typeof c?.name === "string" && c.name.trim() ? c.name.trim() : DEFAULT_MAINTENANCE.contact.name,
          phone: typeof c?.phone === "string" && c.phone.trim() ? c.phone.trim() : DEFAULT_MAINTENANCE.contact.phone,
          email: typeof c?.email === "string" && c.email.trim() ? c.email.trim() : DEFAULT_MAINTENANCE.contact.email,
        });
      } catch {
        // ignore
      } finally {
        if (mounted) setPageLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [backendUrl]);

  /** Sau khi tải xong, bỏ qua một lần kích hoạt effect để không POST trùng ngay lúc hydrate */
  useEffect(() => {
    if (pageLoading) return;
    const t = setTimeout(() => {
      skipFieldAutosaveRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [pageLoading]);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  /**
   * Chỉnh nội dung form: lưu tự động (debounce), giữ nguyên trạng thái bật/tắt hiện tại.
   * Bật/tắt bảo trì: chỉ qua nút gạt (một lần gọi API kèm toàn bộ form).
   */
  useEffect(() => {
    if (pageLoading || skipFieldAutosaveRef.current) return;
    const id = setTimeout(() => {
      save(enabledRef.current, { silent: true });
    }, 700);
    return () => clearTimeout(id);
  }, [title, message, expectedTime, contact, pageLoading, save]);

  const statusText = enabled ? "Đang bảo trì" : "Hoạt động bình thường";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Bảo trì</h1>
          <p className="text-sm text-gray-500 font-medium">
            Gạt công tắc để bật/tắt bảo trì và đồng bộ cấu hình. Khi chỉnh tiêu đề / thông báo / liên hệ, hệ thống lưu tự động sau vài giây.
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${
            enabled
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              enabled ? "bg-amber-500" : "bg-emerald-500"
            }`}
            aria-hidden
          />
          {statusText}
        </div>
      </div>

      {/* Toggle card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-4 text-white">
          <Power className="h-5 w-5" aria-hidden />
          <p className="text-sm font-extrabold">Điều khiển chế độ bảo trì</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-800">Trạng thái hệ thống</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {enabled ? "Website đang ở chế độ bảo trì" : "Website đang hoạt động bình thường"}
              </p>
            </div>
            <button
              type="button"
              disabled={saving || pageLoading}
              onClick={() => save(!enabled)}
              className={`relative inline-flex h-10 w-[76px] items-center rounded-full border transition ${
                enabled
                  ? "bg-amber-500/20 border-amber-500/30"
                  : "bg-slate-200 border-slate-300"
              } ${saving || pageLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-95"}`}
              aria-pressed={enabled}
              aria-label="Bật/tắt bảo trì và cập nhật cấu hình"
              title="Bật/tắt bảo trì — gửi toàn bộ nội dung form lên máy chủ"
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "translate-x-[34px]" : "translate-x-1"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600" aria-hidden />
                ) : (
                  <Wrench className="h-4 w-4 text-slate-700" aria-hidden />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Config card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-6 py-4">
          <UserRound className="h-5 w-5 text-blue-600" aria-hidden />
          <p className="text-sm font-extrabold text-slate-800">Cấu hình nội dung bảo trì</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-600">Tiêu đề trang</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-600">Thông báo bảo trì</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-600">Thời gian dự kiến</label>
            <input
              type="text"
              value={expectedTime}
              onChange={(e) => setExpectedTime(e.target.value)}
              placeholder="Ví dụ: Hoàn thành trong vài giờ tới"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-600">Email hỗ trợ</label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-600">Hotline</label>
              <div className="relative">
                <PhoneCall className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="text"
                  value={contact.phone}
                  onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-600">Người phụ trách</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="text"
                value={contact.name}
                onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MaintenanceSettings;

