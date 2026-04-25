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
import VoucherWallet from "../components/VoucherWallet";

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
      <div className="flex justify-center items-center h-screen bg-gray-50">
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
    <div className="max-w-4xl mx-auto my-10 p-4 animate-in fade-in duration-500 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
          Hồ sơ cá nhân
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  className="w-44 h-44 rounded-full object-cover ring-4 ring-white shadow-xl"
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

          <div className="md:col-span-2 space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
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
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
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
                    className="w-full pl-10 pr-4 py-2.5 border bg-gray-50 text-gray-400 rounded-xl cursor-not-allowed italic"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
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
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="dob"
                  value={userData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-2">
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={userData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
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
