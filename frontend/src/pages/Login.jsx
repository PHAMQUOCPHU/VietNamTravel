import React, { useState, useContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { getCaptcha, loginUser, requestOtp } from "../services";

const LoginPage = () => {
  // SỬA: Dùng setUser cho đúng với AppContext của Phú
  const { backendUrl, setToken, setUser } = useContext(AppContext);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [captchaSvg, setCaptchaSvg] = useState("");
  const [serverCaptcha, setServerCaptcha] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");

  const navigate = useNavigate();

  const fetchCaptcha = useCallback(async () => {
    try {
      const data = await getCaptcha({ backendUrl });
      if (data) {
        setCaptchaSvg(data.data);
        setServerCaptcha(data.text);
      }
    } catch (error) {
      console.error("Lỗi lấy captcha:", error);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isLogin) {
      fetchCaptcha();
    }
  }, [isLogin, fetchCaptcha]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // --- LUỒNG ĐĂNG NHẬP ---
        if (!email || !password || !userCaptchaInput) {
          return toast.error("Vui lòng nhập đầy đủ thông tin và Captcha!");
        }

        const response = await loginUser({
          backendUrl,
          email,
          password,
          userCaptcha: userCaptchaInput,
          serverCaptcha,
        });

        if (response.success) {
          // 1. Lưu Token
          setToken(response.token);
          localStorage.setItem("token", response.token);

          // 2. Lưu thông tin User (Đã có mảng favorites từ Backend gửi về)
          // SỬA: Dùng setUser thay vì setUserData
          setUser(response.user);

          // QUAN TRỌNG: Backend đã populate tour bên trong favorites rồi
          // Khi lưu vào state 'user', React sẽ nhận diện được ngay.

          toast.success(`Chào mừng ${response.user.name} quay lại!`);
          navigate("/");
        } else {
          toast.error(response.message);
          fetchCaptcha();
        }
      } else {
        // --- LUỒNG ĐĂNG KÝ ---
        if (!name || !phone || !email || !password || !confirmPassword)
          return toast.error("Điền đủ thông tin!");
        if (!/^0\d{9,10}$/.test(phone.trim())) {
          return toast.error("Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)");
        }
        if (password.length < 6) {
          return toast.error("Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (password !== confirmPassword) {
          return toast.error("Mật khẩu nhập lại không khớp");
        }

        const response = await requestOtp({ backendUrl, email });

        if (response.success) {
          toast.info("Mã xác thực đã gửi tới Email!");
          navigate("/verify-otp", { state: { name, phone, email, password } });
        } else {
          toast.error(response.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi kết nối");
      fetchCaptcha();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 font-sans">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-10">
        Welcome to <span className="text-blue-500">VietNam Travel</span>
      </h1>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full border border-white">
        <h2 className="text-3xl font-semibold text-center text-gray-800">
          {isLogin ? "Đăng Nhập" : "Đăng Ký"}
        </h2>

        <form onSubmit={onSubmitHandler} className="space-y-4 mt-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                placeholder="Nhập họ tên"
                required
              />
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                placeholder="Ví dụ: 0912345678"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
              placeholder="example@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nhập lại mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 mt-1 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          )}

          {isLogin && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Mã xác thực (Captcha)
              </label>
              <div className="flex items-center gap-2 border rounded-lg overflow-hidden bg-white/50">
                <div
                  className="cursor-pointer h-[42px] bg-white flex items-center justify-center px-2 border-r hover:bg-gray-100 transition"
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  onClick={fetchCaptcha}
                  title="Nhấn để đổi mã khác"
                />
                <input
                  type="text"
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  className="flex-1 px-4 py-2 outline-none bg-transparent font-bold tracking-widest text-blue-700"
                  placeholder="Nhập mã"
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">
                * Nhấn vào hình ảnh để đổi mã mới
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg active:scale-95 duration-200"
          >
            {isLogin ? "Đăng nhập" : "Gửi mã xác thực OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isLogin && (
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-gray-500 hover:text-blue-600 mb-4 block mx-auto underline-offset-4 hover:underline transition"
            >
              Bạn quên mật khẩu?
            </button>
          )}
          <p className="text-sm text-gray-600">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <span
              className="text-blue-600 font-bold cursor-pointer hover:underline"
              onClick={() => {
                setIsLogin(!isLogin);
                setName("");
                setPhone("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              {isLogin ? "Tạo tài khoản ngay" : "Đăng nhập tại đây"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
