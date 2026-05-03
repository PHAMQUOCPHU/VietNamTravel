import React, { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import { CheckCircle, XCircle, Loader, Download } from "lucide-react";
import confetti from "canvas-confetti";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { backendUrl, token } = useContext(AppContext);
  const [status, setStatus] = useState("processing"); // processing, success, fail
  const [bookingData, setBookingData] = useState(null);
  const confettiTriggered = useRef(false);

  // Trigger confetti animation
  const triggerConfetti = () => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;

    const end = Date.now() + 5 * 1000; // 5 seconds
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60 + Math.random() * 60,
        spread: 55,
        origin: { x: 0 },
        colors: [colors[Math.floor(Math.random() * colors.length)]],
      });
      confetti({
        particleCount: 2,
        angle: 120 - Math.random() * 60,
        spread: 55,
        origin: { x: 1 },
        colors: [colors[Math.floor(Math.random() * colors.length)]],
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
        const vnp_TxnRef = searchParams.get("vnp_TxnRef");

        if (vnp_ResponseCode === "00") {
          const dedupeKey = vnp_TxnRef
            ? `vnpay_verify_done_${vnp_TxnRef}`
            : null;
          if (dedupeKey && sessionStorage.getItem(dedupeKey)) {
            setStatus("success");
            await fetchBookingDetails();
            triggerConfetti();
            return;
          }

          const response = await axios.post(
            `${backendUrl}/api/payment/vnpay-verify`,
            {
              vnp_TxnRef,
              vnp_ResponseCode,
            },
          );

          if (response.data.success) {
            if (dedupeKey) sessionStorage.setItem(dedupeKey, "1");
            setStatus("success");
            await fetchBookingDetails();
            triggerConfetti();
          } else {
            setStatus("fail");
          }
        } else {
          setStatus("fail");
        }
      } catch (error) {
        console.error("Verify Error:", error);
        setStatus("fail");
      }
    };

    verifyPayment();
  }, [searchParams, backendUrl]);

  // Fetch booking details
  const fetchBookingDetails = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/bookings`, {
        headers: { token },
      });

      if (response.data.success && response.data.bookings.length > 0) {
        // Lấy booking mới nhất (đã được xác nhận)
        const latestBooking = response.data.bookings[0];
        setBookingData(latestBooking);
      }
    } catch (error) {
      console.error("Fetch booking error:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const successVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
  };

  const checkmarkVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.3,
      },
    },
    pulse: {
      scale: [1, 1.15, 1],
      transition: { repeat: Infinity, repeatDelay: 2, duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <canvas
        id="confetti-canvas"
        style={{ position: "fixed", top: 0, left: 0 }}
      />

      {status === "processing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border border-gray-100"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse" />
              <Loader
                className="animate-spin text-blue-600 absolute inset-2"
                size={40}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Đang xác thực giao dịch
              </h2>
              <p className="text-xs text-gray-500">Vui lòng đợi...</p>
            </div>
          </div>
        </motion.div>
      )}

      {status === "success" && (
        <motion.div
          variants={successVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 overflow-hidden"
        >
          {/* Header with blue gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 pb-8 text-white relative">
            <motion.div
              variants={checkmarkVariants}
              initial="initial"
              animate={["animate", "pulse"]}
              className="mb-3 flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg" />
                <CheckCircle
                  size={64}
                  className="relative z-10"
                  strokeWidth={1.5}
                />
              </div>
            </motion.div>

            <h1 className="text-2xl font-black text-center mb-1 tracking-tight">
              Thanh toán thành công!
            </h1>
            <p className="text-center text-blue-100 text-xs font-medium">
              Đơn hàng đã được xác nhận
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-5 space-y-4">
            {/* Summary Card */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
              {/* Booking ID */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                  Mã đơn hàng
                </p>
                <p className="font-mono text-xs font-bold text-gray-900 break-all">
                  {bookingData?._id || "Đang tải..."}
                </p>
              </div>

              <div className="border-t border-blue-200" />

              {/* Tour Name */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                  Tour đặt
                </p>
                <p className="text-sm font-bold text-gray-900 line-clamp-2">
                  {bookingData?.tourTitle ||
                    bookingData?.tourId?.title ||
                    "Đang tải..."}
                </p>
              </div>

              <div className="border-t border-blue-200" />

              {/* Total Price */}
              <div className="flex items-baseline justify-between pt-1">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Tổng tiền
                </p>
                <p className="text-xl font-black text-blue-600">
                  {bookingData
                    ? formatCurrency(bookingData.totalPrice)
                    : "Đang tải..."}
                </p>
              </div>
            </div>

            {/* Additional Info */}
            {bookingData && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">
                    Khách
                  </p>
                  <p className="font-bold text-gray-900">
                    {(bookingData.guestSize?.adult || 1) +
                      (bookingData.guestSize?.children || 0)}{" "}
                    người
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">
                    Trạng thái
                  </p>
                  <p className="font-bold text-blue-600">Xác nhận</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/my-booking")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg font-bold text-sm transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Xem đơn hàng
              </motion.button>
            </div>

            {/* Footer message */}
            <p className="text-center pt-2 border-t border-gray-200 text-xs text-gray-500">
              Vé điện tử sẽ được gửi qua email
            </p>
          </div>
        </motion.div>
      )}

      {status === "fail" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mb-4 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full blur-lg" />
              <XCircle
                size={64}
                className="text-red-500 relative z-10"
                strokeWidth={1.5}
              />
            </div>
          </motion.div>

          <h2 className="text-xl font-black text-gray-900 mb-2">
            Thanh toán thất bại
          </h2>
          <p className="text-gray-500 mb-4 text-sm">
            Giao dịch bị hủy hoặc có lỗi xảy ra.
          </p>

          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/my-booking")}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              Quay lại đơn hàng
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PaymentReturn;
