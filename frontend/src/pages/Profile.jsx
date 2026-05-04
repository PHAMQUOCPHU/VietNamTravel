import React, { useContext, useState, useEffect } from "react";
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

const Profile = () => {
  const { user } = useContext(AppContext);
  const { updateProfile } = useAuth();

  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/demo/image/upload/d_avatar.png/non_existent_id.png";

  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    dob: "",
    gender: "male",
  });

  const [image, setImage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        phone: user.phone || "",
        dob: user.dob ? user.dob.split("T")[0] : "",
        gender: user.gender || "male",
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
      formData.append("dob", userData.dob);
      formData.append("gender", userData.gender);
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
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="dob"
                  value={userData.dob}
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

    </div>
  );
};

export default Profile;
