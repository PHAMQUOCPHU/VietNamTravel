import React, { useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { backendUrl, setToken, setUser } = useContext(AppContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  // --- PHẦN CAPTCHA ---
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [serverCaptcha, setServerCaptcha] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");

  const fetchCaptcha = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/captcha`);
      if (response.data) {
        setCaptchaSvg(response.data.data);
        setServerCaptcha(response.data.text);
      }
    } catch (error) {
      console.error("Lỗi lấy captcha:", error);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, [isLogin]);

  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      if (!email || !password || (isLogin ? !userCaptchaInput : !name)) {
        toast.error("Vui lòng điền đầy đủ thông tin và mã Captcha!");
        return;
      }

      let response;

      // Determine whether it's login or register
      if (isLogin) {
        // Update login route to match backend API
        response = await axios.post(`${backendUrl}/api/user/login`, {
          email,
          password,
          userCaptcha: userCaptchaInput,
          serverCaptcha: serverCaptcha,
        });
      } else {
        response = await axios.post(`${backendUrl}/api/user/register`, {
          name,
          email,
          password,
        });
      }

      // Check if response is successful
      if (response.data.success) {
        const { token, user } = response.data;
        setToken(token);
        setUser(user);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        toast.success(isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!");
        navigate("/");
      } else {
        toast.error(response.data.message || "Có lỗi xảy ra!");
        fetchCaptcha();
        setUserCaptchaInput("");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
      fetchCaptcha();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-10">
        Welcome to <span className="text-blue-500">VietNam Travel</span>
      </h1>

      <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full border border-white">
        <h2 className="text-3xl font-semibold text-center text-gray-800">
          {isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={onSubmitHandler} className="space-y-4 mt-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nhập họ tên"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your password"
            />
          </div>

          {/* --- GIAO DIỆN CAPTCHA --- */}
          {isLogin && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Xác nhận mã Captcha</label>
              <div className="flex items-center gap-2 border rounded-lg overflow-hidden bg-gray-50 shadow-inner">
                <div
                  className="cursor-pointer h-[40px] border-r border-gray-300 hover:opacity-80 transition bg-white"
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  onClick={fetchCaptcha}
                  title="Nhấn để đổi mã khác"
                />
                <input
                  type="text"
                  value={userCaptchaInput}
                  onChange={(e) => setUserCaptchaInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 border-none bg-transparent outline-none focus:ring-0"
                  placeholder="Nhập mã"
                />
              </div>
              <p className="text-[10px] text-gray-400 text-center italic mt-1">Nhấp vào ảnh để làm mới mã</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 mt-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 shadow-md"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          {/* PHẦN QUÊN MẬT KHẨU TÁCH RIÊNG KHỎI THẺ P */}
          {isLogin && (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => toast.info("Tính năng khôi phục mật khẩu đang được xây dựng!")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Quên mật khẩu?</span>
              </button>
            </div>
          )}

          <p className="text-sm">
            {isLogin ? (
              <>
                Bạn không có tài khoản?{" "}
                <span
                  className="text-blue-600 font-medium cursor-pointer hover:underline"
                  onClick={() => setIsLogin(false)}
                >
                  Đăng ký
                </span>
              </>
            ) : (
              <>
                Bạn đã có tài khoản?{" "}
                <span
                  className="text-blue-600 font-medium cursor-pointer hover:underline"
                  onClick={() => setIsLogin(true)}
                >
                  Đăng nhập
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
