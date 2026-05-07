import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { createVnPayPayment } from "../services";

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const { booking } = state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!booking) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <AlertTriangle size={48} className="text-orange-500" />
        <p className="text-xl font-bold">Không tìm thấy thông tin đơn hàng</p>
        <button
          onClick={() => navigate("/my-booking")}
          className="text-blue-600 underline"
        >
          Quay lại danh sách đặt chỗ
        </button>
      </div>
    );
  }

  const handleVnpayPayment = async () => {
    if (isProcessing) return; // Chặn bấm liên tiếp
    if (!termsAccepted) {
      toast.warning(
        "Vui lòng đồng ý với Điều khoản dịch vụ của VietNam Travel trước khi thanh toán.",
      );
      return;
    }
    setIsProcessing(true);

    try {
      // Đảm bảo số tiền là số nguyên
      const amountToSend = Math.round(Number(booking.totalPrice));

      const data = await createVnPayPayment({
        backendUrl,
        amount: amountToSend,
        bookingId: booking._id,
        tourTitle: booking.tourTitle,
      });

      if (data.success && data.paymentUrl) {
        toast.info("Đang chuyển hướng sang cổng thanh toán VNPay...");
        // Chuyển hướng trình duyệt sang trang thanh toán của VNPay
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || "Không thể tạo link thanh toán");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Lỗi kết nối VNPay:", error);
      toast.error(
        error.response?.data?.message ||
          "Lỗi máy chủ thanh toán. Phú kiểm tra lại Backend nhé!",
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 py-12 sm:p-4 sm:py-20">
      <div className="w-full max-w-md rounded-2xl border-2 border-blue-50 bg-white p-5 text-center shadow-xl sm:rounded-[2.5rem] sm:border-4 sm:p-8">
        <h2 className="mb-2 text-xl font-black uppercase tracking-tighter text-[#005baa] sm:text-2xl">
          Thanh Toán VNPay
        </h2>
        <p className="text-gray-500 text-sm mb-8 italic">
          Hệ thống thanh toán bảo mật VietNam Travel
        </p>

        <div className="bg-blue-50 p-6 rounded-2xl mb-8 space-y-3 border border-blue-100">
          <div className="text-left">
            <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest">
              Tên Tour
            </p>
            <p className="text-sm font-bold text-[#1e3a8a] line-clamp-2">
              {booking.tourTitle}
            </p>
          </div>
          <div className="border-t border-blue-100 pt-3 text-left">
            <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest">
              Tổng thanh toán
            </p>
            <p className="text-3xl font-black text-[#005baa]">
              {Number(booking.totalPrice).toLocaleString()}đ
            </p>
          </div>
          <div className="border-t border-blue-100 pt-3 text-left">
            <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest">
              Mã đơn hàng
            </p>
            <p className="text-xs font-mono text-gray-500 truncate">
              {booking._id}
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 mb-6 text-left cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/90 p-3 sm:p-4">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#005baa] focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs sm:text-sm text-slate-600 leading-snug">
            Tôi đồng ý với{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#005baa] underline underline-offset-2 hover:text-[#004a8a]"
            >
              Điều khoản dịch vụ
            </Link>{" "}
            của <span className="font-semibold text-slate-800">VietNam Travel</span>{" "}
            trước khi thanh toán.
          </span>
        </label>

        <button
          onClick={handleVnpayPayment}
          disabled={isProcessing || !termsAccepted}
          className={`w-full py-5 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
            isProcessing || !termsAccepted
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#005baa] hover:bg-[#004a8a] active:scale-95 shadow-blue-100"
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang kết nối...
            </>
          ) : (
            <>
              <CreditCard size={22} />
              Thanh Toán Ngay
            </>
          )}
        </button>

        <div className="mt-8 flex flex-col items-center gap-2">
          <img
            src="https://sandbox.vnpayment.vn/paymentv2/images/img/logos/vnpay-logo.png"
            alt="VNPay Logo"
            className="h-6"
          />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Safe & Secure Payment
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
