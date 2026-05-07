import React, { useContext, useMemo, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  Camera,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { updateHomeSlide } from "../services";

const Profile = () => {
  const { user, token, backendUrl, siteConfig, refreshSiteConfig } =
    useContext(AppContext);
  const { updateProfile } = useAuth();

  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/demo/image/upload/d_avatar.png/non_existent_id.png";

  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    gender: "male",
    birthYear: "",
    occupation: "",
    maritalStatus: "other",
  });

  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerFiles, setBannerFiles] = useState([null, null, null]);
  const [bannerLoading, setBannerLoading] = useState([false, false, false]);

  const bannerSlides = useMemo(() => {
    const defaults = [
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
    ];
    const fromConfig =
      Array.isArray(siteConfig?.homeSlides) && siteConfig.homeSlides.length
        ? siteConfig.homeSlides
        : null;
    const safe = fromConfig || defaults;
    return defaults.map((d, i) => safe[i] || d);
  }, [siteConfig?.homeSlides]);

  useEffect(() => {
    if (user) {
      const yearFromDob = user.dob
        ? new Date(user.dob).getFullYear()
        : "";
      setUserData({
        name: user.name || "",
        phone: user.phone || "",
        gender: user.gender || "male",
        birthYear:
          user.birthYear != null && String(user.birthYear).trim() !== ""
            ? String(user.birthYear)
            : yearFromDob && Number.isFinite(yearFromDob)
              ? String(yearFromDob)
              : "",
        occupation: user.occupation || "",
        maritalStatus: user.maritalStatus || "other",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!user?._id) {
      toast.error("Không tìm thấy ID người dùng. Hãy thử F5 lại trang.");
      return;
    }
    if (loading) return;
    if (!/^0\d{9,10}$/.test(userData.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("userId", user._id);
      formData.append("name", userData.name);
      formData.append("phone", userData.phone);
      formData.append("gender", userData.gender);
      formData.append("birthYear", userData.birthYear);
      formData.append("occupation", userData.occupation);
      formData.append("maritalStatus", userData.maritalStatus);
      if (image) formData.append("image", image);

      const success = await updateProfile(formData);
      if (success) setImage(false);
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Lỗi cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const uploadBannerSlot = async (slotIndex) => {
    const slot = slotIndex + 1;
    const file = bannerFiles[slotIndex];
    if (!file) {
      toast.info("Vui lòng chọn ảnh trước khi upload");
      return;
    }
    if (!token) {
      toast.error("Bạn cần đăng nhập lại");
      return;
    }
    if (user?.role !== "admin") {
      toast.error("Chỉ admin mới có thể chỉnh banner");
      return;
    }

    setBannerLoading((prev) => {
      const next = [...prev];
      next[slotIndex] = true;
      return next;
    });

    try {
      const data = await updateHomeSlide({
        backendUrl,
        token,
        slot,
        imageFile: file,
        alt: bannerSlides[slotIndex]?.alt,
      });
      if (data?.success) {
        toast.success("Đã cập nhật banner");
        setBannerFiles((prev) => {
          const next = [...prev];
          next[slotIndex] = null;
          return next;
        });
        await refreshSiteConfig?.();
      } else {
        toast.error(data?.message || "Không thể cập nhật banner");
      }
    } catch (_error) {
      toast.error("Upload banner thất bại");
    } finally {
      setBannerLoading((prev) => {
        const next = [...prev];
        next[slotIndex] = false;
        return next;
      });
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gray-50 px-4 py-16 dark:bg-slate-950">
        <div className="text-center">
          <Loader2
            className="animate-spin text-blue-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-gray-500 animate-pulse">
            Đang tải thông tin cá nhân...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-in space-y-10 px-3 py-6 fade-in duration-500 sm:my-8 sm:space-y-12 sm:px-4 sm:py-10 md:my-10">
      <div>
        <h1 className="mb-6 border-b pb-3 text-2xl font-bold text-gray-800 dark:border-slate-700 dark:text-slate-100 sm:mb-8 sm:pb-4 sm:text-3xl">
          Hồ sơ cá nhân
        </h1>
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <input
                type="file"
                id="avatar"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
              <label htmlFor="avatar" className="cursor-pointer relative block">
                <img
                  src={
                    image
                      ? URL.createObjectURL(image)
                      : user?.image && user.image !== ""
                        ? user.image
                        : DEFAULT_AVATAR
                  }
                  alt="Avatar"
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                  className="h-32 w-32 rounded-full object-cover shadow-xl ring-4 ring-white dark:ring-slate-800 sm:h-40 sm:w-40 md:h-44 md:w-44"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                  <Camera size={32} className="text-white drop-shadow-md" />
                </div>
                <div className="absolute bottom-2 right-2 p-2.5 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white">
                  <Camera size={18} />
                </div>
              </label>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-400 italic">
                Dung lượng tối đa 1MB (JPG, PNG)
              </p>
            </div>
          </div>

          <div className="min-w-0 space-y-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:space-y-6 sm:rounded-3xl sm:p-6 md:col-span-2 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className="w-full min-w-0 rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full min-w-0 cursor-not-allowed rounded-xl border bg-gray-50 py-2.5 pl-10 pr-4 italic text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    className="w-full min-w-0 rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Năm sinh
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1900"
                  max={new Date().getFullYear()}
                  name="birthYear"
                  value={userData.birthYear}
                  onChange={handleInputChange}
                  className="w-full min-w-0 rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={userData.gender}
                  onChange={handleInputChange}
                  className="w-full min-w-0 rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Nghề nghiệp
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={userData.occupation}
                  onChange={handleInputChange}
                  placeholder="VD: Nhân viên văn phòng"
                  className="w-full min-w-0 rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Tình trạng hôn nhân
                </label>
                <select
                  name="maritalStatus"
                  value={userData.maritalStatus}
                  onChange={handleInputChange}
                  className="w-full min-w-0 rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="single">Độc thân</option>
                  <option value="married">Đã có gia đình</option>
                  <option value="other">Khác / Không muốn nói</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 sm:grid-cols-3 sm:px-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Ngày đăng ký
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Vai trò
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.role === "admin" ? "Quản trị viên" : "Thành viên"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Hạng thành viên
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.rank || "Bạc"}
                </p>
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : null}
                {loading ? "Đang xử lý..." : "Cập nhật hồ sơ"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {user?.role === "admin" ? (
        <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl sm:p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Cài đặt banner trang chủ
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload ảnh để thay thế banner (carousel) ở trang Home. Mỗi slot tương ứng
              1 slide.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {bannerSlides.map((slide, idx) => {
              const pendingFile = bannerFiles[idx];
              const previewUrl = pendingFile
                ? URL.createObjectURL(pendingFile)
                : slide.url;
              return (
                <div
                  key={idx}
                  className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="aspect-video w-full overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700/80">
                    <img
                      src={previewUrl}
                      alt={slide.alt || `Slide ${idx + 1}`}
                      className="h-full w-full object-cover"
                      onLoad={() => {
                        if (pendingFile) URL.revokeObjectURL(previewUrl);
                      }}
                    />
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Slide {idx + 1}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700 dark:text-slate-300"
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
                      disabled={!bannerFiles[idx] || bannerLoading[idx]}
                      className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                    >
                      {bannerLoading[idx] ? "Đang upload..." : "Cập nhật slide"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

    </div>
  );
};

export default Profile;
