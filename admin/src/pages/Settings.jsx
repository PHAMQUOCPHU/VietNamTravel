import { motion } from "framer-motion";
import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";
import { getPublicSiteBaseUrl } from "../config/publicSiteUrl";
import {
  Save,
  Globe,
  Bell,
  ShieldCheck,
  Palette,
  Phone,
  Mail,
  Image as ImageIcon,
  Upload,
  KeyRound,
  Lock,
  LayoutPanelLeft,
} from "lucide-react";
import { resolveAdminPanelLogoSrc } from "../utils/adminBranding";

const Settings = () => {
  const { aToken, setAToken, backendUrl, adminLogoUrl, refreshAdminBranding } =
    useContext(AdminContext);
  const [activeTab, setActiveTab] = useState("general");
  const publicSiteBaseUrl = getPublicSiteBaseUrl();

  const resolvePublicAssetUrl = (url) => {
    const raw = typeof url === "string" ? url.trim() : "";
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) return `${publicSiteBaseUrl}${raw}`;
    return `${publicSiteBaseUrl}/${raw}`;
  };

  const defaultSlides = useMemo(
    () => [
      {
        url: "/home-slides/slide-1.png",
        alt: "Khám phá Vịnh Hạ Long — VietNam Travel",
      },
      {
        url: "/home-slides/slide-2.png",
        alt: "Việt Nam — Hội An, biển và hành trình của bạn",
      },
      {
        url: "/home-slides/slide-3.png",
        alt: "Du lịch Việt Nam — ưu đãi và hành trình trọn vẹn",
      },
    ],
    [],
  );

  const [siteSlides, setSiteSlides] = useState(defaultSlides);
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoObjectUrl, setLogoObjectUrl] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [adminLogoFile, setAdminLogoFile] = useState(null);
  const [adminLogoObjectUrl, setAdminLogoObjectUrl] = useState(null);
  const [adminLogoUploading, setAdminLogoUploading] = useState(false);
  const [bannerFiles, setBannerFiles] = useState([null, null, null]);
  const [bannerUploading, setBannerUploading] = useState([false, false, false]);

  const [notifPrefs, setNotifPrefs] = useState({
    newOrder: true,
    cancelRequest: true,
    newUser: true,
    newReview: true,
    paymentSuccess: true,
    blogComment: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // NOTE: Chế độ bảo trì đã tách sang trang /admin/settings/maintenance

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/site-config/public`);
        if (!mounted) return;
        if (data?.success && Array.isArray(data.homeSlides)) {
          const safe = defaultSlides.map((d, i) => data.homeSlides[i] || d);
          setSiteSlides(safe);
        } else {
          setSiteSlides(defaultSlides);
        }
        if (data?.success && typeof data.logoUrl === "string") {
          setSiteLogoUrl(data.logoUrl.trim());
        }
        if (data?.success && data?.notifications && typeof data.notifications === "object") {
          setNotifPrefs((prev) => ({ ...prev, ...data.notifications }));
        }
      } catch {
        setSiteSlides(defaultSlides);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [backendUrl, defaultSlides]);

  const saveNotifPrefs = async () => {
    if (!aToken) {
      toast.error("Bạn chưa đăng nhập admin");
      return;
    }
    if (notifSaving) return;
    setNotifSaving(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/site-config/notifications`,
        { notifications: notifPrefs },
        { headers: { atoken: aToken } },
      );
      if (data?.success && data?.notifications) {
        setNotifPrefs((prev) => ({ ...prev, ...data.notifications }));
        toast.success(data.message || "Đã lưu cấu hình thông báo");
      } else {
        toast.error(data?.message || "Không thể lưu cấu hình thông báo");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Lưu cấu hình thông báo thất bại",
      );
    } finally {
      setNotifSaving(false);
    }
  };

  const SwitchRow = ({ label, desc, value, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-gray-800">{label}</p>
          {desc ? (
            <p className="mt-1 text-[11px] font-medium text-gray-500">{desc}</p>
          ) : null}
        </div>
        <span
          className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
            value
              ? "border-blue-600 bg-blue-600"
              : "border-gray-200 bg-gray-200"
          }`}
          aria-hidden
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
              value ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </span>
      </div>
    </button>
  );

  useEffect(() => {
    if (!logoFile) {
      setLogoObjectUrl(null);
      return undefined;
    }
    const u = URL.createObjectURL(logoFile);
    setLogoObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [logoFile]);

  useEffect(() => {
    if (!adminLogoFile) {
      setAdminLogoObjectUrl(null);
      return undefined;
    }
    const u = URL.createObjectURL(adminLogoFile);
    setAdminLogoObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [adminLogoFile]);

  const uploadBannerSlot = async (slotIndex) => {
    const file = bannerFiles[slotIndex];
    if (!file) {
      toast.info("Vui lòng chọn ảnh trước khi upload");
      return;
    }
    if (!aToken) {
      toast.error("Bạn chưa đăng nhập admin");
      return;
    }

    setBannerUploading((prev) => {
      const next = [...prev];
      next[slotIndex] = true;
      return next;
    });

    try {
      const fd = new FormData();
      fd.append("slot", String(slotIndex + 1));
      fd.append("alt", siteSlides?.[slotIndex]?.alt || `Slide ${slotIndex + 1}`);
      fd.append("image", file);

      const { data } = await axios.post(
        `${backendUrl}/api/site-config/home-slide`,
        fd,
        {
          headers: { atoken: aToken },
        },
      );

      if (data?.success && Array.isArray(data.homeSlides)) {
        const safe = defaultSlides.map((d, i) => data.homeSlides[i] || d);
        setSiteSlides(safe);
        setBannerFiles((prev) => {
          const next = [...prev];
          next[slotIndex] = null;
          return next;
        });
        toast.success(data.message || "Đã cập nhật banner");
      } else {
        toast.error(data?.message || "Không thể cập nhật banner");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Upload banner thất bại (hết phiên?)",
      );
    } finally {
      setBannerUploading((prev) => {
        const next = [...prev];
        next[slotIndex] = false;
        return next;
      });
    }
  };

  const uploadSiteLogo = async () => {
    const file = logoFile;
    if (!file) {
      toast.info("Vui lòng chọn ảnh logo trước khi upload");
      return;
    }
    if (!aToken) {
      toast.error("Bạn chưa đăng nhập admin");
      return;
    }
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);

      const { data } = await axios.post(
        `${backendUrl}/api/site-config/logo`,
        fd,
        {
          headers: { atoken: aToken },
        },
      );

      if (data?.success && typeof data.logoUrl === "string") {
        setSiteLogoUrl(data.logoUrl.trim());
        setLogoFile(null);
        toast.success(data.message || "Đã cập nhật logo");
      } else {
        toast.error(data?.message || "Không thể cập nhật logo");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Upload logo thất bại. Kiểm tra backend / Cloudinary.",
      );
    } finally {
      setLogoUploading(false);
    }
  };

  const uploadAdminPanelLogo = async () => {
    const file = adminLogoFile;
    if (!file) {
      toast.info("Vui lòng chọn ảnh logo admin trước khi upload");
      return;
    }
    if (!aToken) {
      toast.error("Bạn chưa đăng nhập admin");
      return;
    }
    setAdminLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);

      const { data } = await axios.post(
        `${backendUrl}/api/site-config/admin-logo`,
        fd,
        { headers: { atoken: aToken } },
      );

      if (data?.success) {
        setAdminLogoFile(null);
        await refreshAdminBranding();
        toast.success(data.message || "Đã cập nhật logo admin");
      } else {
        toast.error(data?.message || "Không thể cập nhật logo admin");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Upload logo admin thất bại. Kiểm tra backend / Cloudinary.",
      );
    } finally {
      setAdminLogoUploading(false);
    }
  };

  const submitChangePassword = async () => {
    const oldPassword = String(pwOld || "");
    const newPassword = String(pwNew || "");
    const confirmPassword = String(pwConfirm || "");

    if (!aToken) {
      toast.error("Bạn chưa đăng nhập admin");
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.info("Vui lòng nhập đủ mật khẩu hiện tại / mới / xác nhận");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp");
      return;
    }
    if (oldPassword === newPassword) {
      toast.info("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }
    if (pwLoading) return;

    setPwLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/admin/change-password`,
        { oldPassword, newPassword },
        { headers: { atoken: aToken } },
      );
      if (data?.success) {
        toast.success(data.message || "Đổi mật khẩu thành công");
        setPwOld("");
        setPwNew("");
        setPwConfirm("");
        // logout to require re-auth with new password
        setAToken("");
      } else {
        toast.error(data?.message || "Không thể đổi mật khẩu");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false);
    }
  };

  const logoPreviewDisplay =
    logoObjectUrl ?? resolvePublicAssetUrl(siteLogoUrl || "/logo.png");

  const adminLogoPreviewDisplay =
    adminLogoObjectUrl ?? resolveAdminPanelLogoSrc(adminLogoUrl);

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
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "general"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "notifications"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Thông báo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "security"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Bảo mật
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "appearance"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Giao diện
          </button>
        </div>

        {/* Nội dung bên phải */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8 space-y-8">
          {/* Section 1: Thông tin Website */}
          {activeTab === "general" ? (
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
          ) : null}

          {/* Section 2: Bảo mật cơ bản */}
          {activeTab === "security" ? (
            <div className="space-y-4 pt-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Quyền hạn
                Admin
              </h3>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                      <KeyRound size={18} className="text-slate-800" />
                      Đổi mật khẩu Admin
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Sau khi đổi mật khẩu, hệ thống sẽ tự đăng xuất để bạn đăng nhập lại.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200">
                    <Lock size={16} />
                    Bảo mật
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={pwOld}
                      onChange={(e) => setPwOld(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-700"
                      placeholder="Nhập mật khẩu hiện tại"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={pwNew}
                        onChange={(e) => setPwNew(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-700"
                        placeholder="Tối thiểu 6 ký tự"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-700"
                        placeholder="Nhập lại mật khẩu mới"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={submitChangePassword}
                    disabled={pwLoading}
                    className="mt-1 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-100 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-emerald-700"
                  >
                    {pwLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "notifications" ? (
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <Bell size={18} className="text-amber-600" /> Thông báo
              </h3>
              <div className="space-y-3">
                <SwitchRow
                  label="Thông báo đơn hàng mới"
                  desc="Bật để nhận thông báo khi có khách đặt tour mới."
                  value={Boolean(notifPrefs.newOrder)}
                  onChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, newOrder: v }))
                  }
                />
                <SwitchRow
                  label="Thông báo yêu cầu hủy tour"
                  desc="Bật để nhận thông báo khi khách gửi yêu cầu hủy."
                  value={Boolean(notifPrefs.cancelRequest)}
                  onChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, cancelRequest: v }))
                  }
                />
                <SwitchRow
                  label="Thông báo tài khoản mới được tạo"
                  desc="Bật để nhận thông báo khi có tài khoản mới (tự đăng ký hoặc admin tạo)."
                  value={Boolean(notifPrefs.newUser)}
                  onChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, newUser: v }))
                  }
                />
                <SwitchRow
                  label="Thông báo đánh giá (Review) mới"
                  desc="Bật để nhận thông báo khi có review mới."
                  value={Boolean(notifPrefs.newReview)}
                  onChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, newReview: v }))
                  }
                />
                <SwitchRow
                  label="Thông báo thanh toán thành công"
                  desc="Bật để nhận thông báo khi đơn thanh toán online thành công."
                  value={Boolean(notifPrefs.paymentSuccess)}
                  onChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, paymentSuccess: v }))
                  }
                />
                <SwitchRow
                  label="Thông báo bình luận bài viết mới"
                  desc="Bật để nhận thông báo khi có người bình luận bài viết."
                  value={Boolean(notifPrefs.blogComment)}
                  onChange={(v) =>
                    setNotifPrefs((p) => ({ ...p, blogComment: v }))
                  }
                />
              </div>

              <button
                type="button"
                onClick={saveNotifPrefs}
                disabled={notifSaving}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-blue-700"
              >
                {notifSaving ? "Đang lưu..." : "Lưu cấu hình thông báo"}
              </button>
            </div>
          ) : null}

          {activeTab === "appearance" ? (
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <Palette size={18} className="text-purple-600" /> Giao diện
              </h3>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-800">
                      Logo website
                    </p>
                    <p className="text-[11px] font-medium text-gray-500">
                      Hiển thị trên navbar và sidebar trang khách. File PNG/JPG vuông hoặc
                      gần vuông là hợp lý nhất (ví dụ 256×256).
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-purple-100 bg-purple-50 px-3 py-2 text-xs font-extrabold text-purple-700">
                    <ImageIcon size={16} aria-hidden /> Header
                  </span>
                </div>
                <div className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
                  <div className="mx-auto shrink-0 sm:mx-0">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-inner ring-1 ring-gray-100">
                      <img
                        src={logoPreviewDisplay}
                        alt="Logo xem trước"
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-white hover:file:bg-black"
                      onChange={(e) => {
                        setLogoFile(e.target.files?.[0] || null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={uploadSiteLogo}
                      disabled={!logoFile || logoUploading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
                    >
                      <Upload size={18} />
                      {logoUploading ? "Đang upload..." : "Cập nhật logo"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-800">
                      Logo panel admin
                    </p>
                    <p className="text-[11px] font-medium text-gray-500">
                      Sidebar, màn hình đăng nhập admin và favicon tab trình duyệt
                      (chỉ khu vực /admin). Ảnh vuông hoặc gần vuông (ví dụ 256×256)
                      là hợp lý.
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700">
                    <LayoutPanelLeft size={16} aria-hidden /> Sidebar
                  </span>
                </div>
                <div className="mt-4 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
                  <div className="mx-auto shrink-0 sm:mx-0">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-inner ring-1 ring-gray-100">
                      <img
                        src={adminLogoPreviewDisplay}
                        alt="Logo admin xem trước"
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-white hover:file:bg-black"
                      onChange={(e) => {
                        setAdminLogoFile(e.target.files?.[0] || null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={uploadAdminPanelLogo}
                      disabled={!adminLogoFile || adminLogoUploading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
                    >
                      <Upload size={18} />
                      {adminLogoUploading
                        ? "Đang upload..."
                        : "Cập nhật logo admin"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-800">
                      Banner trang chủ (Carousel)
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Upload ảnh để thay thế 3 banner ở trang Home.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-purple-50 px-3 py-2 text-purple-700 text-xs font-extrabold flex items-center gap-2 border border-purple-100">
                    <ImageIcon size={16} />
                    3 slides
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {siteSlides.map((slide, idx) => {
                    const file = bannerFiles[idx];
                    const previewUrl = file
                      ? URL.createObjectURL(file)
                      : resolvePublicAssetUrl(slide.url);
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="aspect-video w-full overflow-hidden rounded-xl ring-1 ring-slate-200/70">
                          <img
                            src={previewUrl}
                            alt={slide.alt || `Slide ${idx + 1}`}
                            className="h-full w-full object-cover"
                            onLoad={() => {
                              if (file) URL.revokeObjectURL(previewUrl);
                            }}
                          />
                        </div>

                        <div className="mt-3 space-y-2">
                          <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                            Slide {idx + 1}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-white hover:file:bg-black"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setBannerFiles((prev) => {
                                const next = [...prev];
                                next[idx] = f;
                                return next;
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => uploadBannerSlot(idx)}
                            disabled={!bannerFiles[idx] || bannerUploading[idx]}
                            className="w-full rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                            <Upload size={18} />
                            {bannerUploading[idx] ? "Đang upload..." : "Cập nhật"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
