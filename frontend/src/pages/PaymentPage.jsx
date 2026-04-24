import React, { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const { booking } = state || {};
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);

    try {
      // Đảm bảo số tiền là số nguyên
      const amountToSend = Math.round(Number(booking.totalPrice));

      const response = await axios.post(`${backendUrl}/api/payment/vnpay`, {
        bookingId: booking._id,
        amount: amountToSend,
      });

      if (response.data.success && response.data.paymentUrl) {
        toast.info("Đang chuyển hướng sang cổng thanh toán VNPay...");
        // Chuyển hướng trình duyệt sang trang thanh toán của VNPay
        window.location.href = response.data.paymentUrl;
      } else {
        toast.error(response.data.message || "Không thể tạo link thanh toán");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 py-20">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border-4 border-blue-50">
        <h2 className="text-2xl font-black text-[#005baa] mb-2 uppercase tracking-tighter">
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

        <button
          onClick={handleVnpayPayment}
          disabled={isProcessing}
          className={`w-full py-5 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
            isProcessing
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
