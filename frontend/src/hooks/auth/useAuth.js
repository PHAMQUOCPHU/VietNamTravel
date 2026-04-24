import { useContext } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../context";
import {
  changePasswordRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  sendSignUpOtpRequest,
  updateProfileRequest,
  verifyAndRegisterRequest,
  verifyForgotOtpRequest,
} from "../../services";

export const useAuth = () => {
  const { backendUrl, setToken, setUser, token } = useContext(AppContext);

  const sendSignUpOtp = async (userData) => {
    try {
      const data = await sendSignUpOtpRequest({ backendUrl, email: userData.email });
      if (data.success) {
        toast.success("Mã OTP đã gửi đến Email!");
        return true;
      }
      toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi gửi OTP");
    }
    return false;
  };

  const verifyAndRegister = async (email, otp, fullData) => {
    try {
      const data = await verifyAndRegisterRequest({ backendUrl, email, otp, fullData });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        return data;
      }
    } catch {
      toast.error("Mã OTP không chính xác hoặc lỗi đăng ký");
    }
    return null;
  };

  const handleForgotPassword = async (email) => {
    try {
      const data = await forgotPasswordRequest({ backendUrl, email });
      if (data.success) {
        toast.success("Mã xác thực đã được gửi vào Email!");
        return true;
      }
      toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi hệ thống");
    }
    return false;
  };

  const verifyOtpForgot = async (email, otp) => {
    try {
      const data = await verifyForgotOtpRequest({ backendUrl, email, otp });
      if (data.success) return true;
      toast.error(data.message);
    } catch {
      toast.error("Mã OTP không chính xác");
    }
    return false;
  };

  const resetPassword = async (email, newPassword) => {
    try {
      const data = await resetPasswordRequest({ backendUrl, email, newPassword });
      if (data.success) {
        toast.success("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
        return true;
      }
    } catch {
      toast.error("Không thể đặt lại mật khẩu");
    }
    return false;
  };

  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
      const data = await changePasswordRequest({
        backendUrl,
        token,
        oldPassword,
        newPassword,
      });
      if (data.success) {
        toast.success(data.message);
        return true;
      }
      toast.error(data.message);
      return false;
    } catch (error) {
      const errorMsg =
        error.response?.status === 404
          ? "Lỗi 404: Đường dẫn API không tồn tại!"
          : error.response?.data?.message || "Lỗi đổi mật khẩu";
      toast.error(errorMsg);
      return false;
    }
  };

  const updateProfile = async (formData) => {
    try {
      const data = await updateProfileRequest({ backendUrl, token, formData });
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success(data.message);
        return true;
      }
      toast.error(data.message);
      return false;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  return {
    sendSignUpOtp,
    verifyAndRegister,
    handleForgotPassword,
    verifyOtpForgot,
    resetPassword,
    handleChangePassword,
    updateProfile,
  };
};
