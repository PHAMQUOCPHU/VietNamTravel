import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  Mail,
  Phone,
  Users,
  MessageSquare,
  Baby,
  AlertCircle,
  TicketPercent,
  X,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import useBooking from "../hooks/useCreateBooking";
import PaymentMethod from "../components/PaymentMethod";

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // LẤY DỮ LIỆU TỪ TOURDETAILS TRUYỀN SANG
  const tour = location.state?.tour;
  const scheduleId = location.state?.scheduleId;
  const rawDate = location.state?.selectedDate;

  const guestSizeFromState = location.state?.guestSize || {
    adult: 1,
    children: 0,
  };
  const initialTotalPrice = location.state?.totalPrice || tour?.price;

  // QUAN TRỌNG: Xử lý an toàn để tránh lỗi "Invalid Date"
  // Nếu rawDate là object { _id, date } thì lấy .date, nếu là chuỗi thì dùng luôn
  const displayDate = typeof rawDate === "object" ? rawDate?.date : rawDate;

  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Hooks phải gọi trước mọi return (Rules of Hooks)
  const {
    formData,
    totalPrice,
    discountAmount,
    setDiscountAmount,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useBooking(
    tour,
    scheduleId,
    guestSizeFromState,
    initialTotalPrice,
    paymentMethod,
  );

  const { backendUrl } = useContext(AppContext);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const handleApplyVoucher = async () => {
    setVoucherError("");
    if (!voucherCode.trim()) {
      setVoucherError("Vui lòng nhập mã giảm giá");
      return;
    }
    setIsApplyingVoucher(true);
    try {
      const tourPrice = tour?.price || 0;
      const basePrice =
        tourPrice * guestSizeFromState.adult +
        tourPrice * 0.6 * guestSizeFromState.children;
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${backendUrl}/api/vouchers/apply`,
        {
          code: voucherCode,
          orderValue: basePrice,
        },
        {
          headers: { token },
        },
      );
      if (data.success) {
        setDiscountAmount(data.discountAmount);
        setAppliedVoucherCode(data.code);
        toast.success(data.message);
      } else {
        setVoucherError(data.message);
      }
    } catch (error) {
      setVoucherError("Lỗi kết nối máy chủ");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setDiscountAmount(0);
    setAppliedVoucherCode("");
    setVoucherCode("");
    setVoucherError("");
  };

  // Kiểm tra nếu không có dữ liệu tour thì quay về trang chủ
  useEffect(() => {
    if (!tour || !scheduleId) {
      console.error("Thiếu thông tin đặt tour!");
    }
  }, [tour, scheduleId]);

  if (!tour) {
    return (
      <div className="text-center py-20 font-bold">
        <p>Dữ liệu tour không hợp lệ!</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const { title = "", price = 0 } = tour;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
            Xác Nhận Đặt Chỗ
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 italic truncate">
            Hành trình:{" "}
            <span className="font-bold text-blue-600 break-all">{title}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl p-4 sm:p-6 md:p-8 border border-white">
              <form
                onSubmit={(e) => handleSubmit(e, appliedVoucherCode)}
                className="space-y-5 sm:space-y-6"
              >
                {/* Thông tin ngày khởi hành - Sửa lỗi Invalid Date */}
                <div className="bg-blue-50/50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm shrink-0">
                    <Calendar className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-blue-600 font-black uppercase tracking-widest">
                      Ngày khởi hành:
                    </p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-blue-900 break-words">
                      {displayDate ? (
                        displayDate.includes("/") ? (
                          displayDate
                        ) : (
                          <>
                            {new Date(displayDate).toLocaleDateString("vi-VN", {
                              weekday: "long",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                            <span className="block text-xs sm:text-sm font-semibold text-blue-700 mt-1">
                              Giờ khởi hành:{" "}
                              {new Date(displayDate).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Asia/Ho_Chi_Minh",
                                },
                              )}
                            </span>
                          </>
                        )
                      ) : (
                        <span className="text-red-500">Chưa xác định ngày</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-bold text-sm sm:text-base text-gray-700 flex items-center gap-2">
                    <User size={16} className="sm:w-5 sm:h-5" /> Thông tin liên
                    lạc
                  </h3>
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      placeholder="Họ và tên người đại diện"
                      className="w-full p-3 sm:p-4 text-sm border-gray-100 bg-gray-50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="Email nhận vé"
                        className="w-full p-3 sm:p-4 text-sm border-gray-100 bg-gray-50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all pl-9 sm:pl-12"
                        required
                      />
                      <Mail
                        className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400"
                        size={16}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="Số điện thoại"
                        className="w-full p-3 sm:p-4 text-sm border-gray-100 bg-gray-50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all pl-9 sm:pl-12"
                        required
                      />
                      <Phone
                        className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400"
                        size={16}
                      />
                    </div>
                  </div>
                </div>

                {/* Phần ghi chú */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare size={14} className="sm:w-4 sm:h-4" /> Ghi
                    chú đặc biệt
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests || ""}
                    onChange={handleChange}
                    placeholder="Ví dụ: Yêu cầu phòng khách sạn, dị ứng thực phẩm..."
                    rows="3"
                    className="w-full p-3 sm:p-4 text-sm border-gray-100 bg-gray-50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-400 outline-none resize-none transition-all"
                  ></textarea>
                </div>

                <PaymentMethod
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 sm:py-5 bg-[#1e3a8a] text-white rounded-lg sm:rounded-[1.5rem] font-black text-base sm:text-xl hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-95 disabled:bg-gray-400"
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác Nhận Đặt Ngay"}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar tóm tắt giá chi tiết */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl p-4 sm:p-6 md:p-7 border border-white sticky top-4 sm:top-5 space-y-4 sm:space-y-6">
              <h3 className="font-black text-sm sm:text-base text-[#1e3a8a] border-b border-gray-50 pb-3 sm:pb-4 uppercase tracking-tight">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <div className="flex items-center gap-2 text-gray-500 shrink-0">
                    <Users size={14} /> Người lớn (x{guestSizeFromState.adult})
                  </div>
                  <span className="font-bold shrink-0">
                    {(price * guestSizeFromState.adult).toLocaleString()}đ
                  </span>
                </div>

                {guestSizeFromState.children > 0 && (
                  <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2 text-gray-500 shrink-0">
                      <Baby size={14} /> Trẻ em (x{guestSizeFromState.children})
                    </div>
                    <span className="font-bold text-emerald-600 shrink-0">
                      {(
                        price *
                        0.6 *
                        guestSizeFromState.children
                      ).toLocaleString()}
                      đ
                    </span>
                  </div>
                )}

                {/* VOUCHER INPUT */}
                <div className="py-3 sm:py-4 border-y border-dashed border-gray-200 space-y-3">
                  <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 italic">
                    Đi du lịch tiết kiệm hơn với mã ưu đãi độc quyền!
                  </p>

                  {appliedVoucherCode ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TicketPercent
                          size={14}
                          className="text-emerald-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-700 truncate">
                            Mã: {appliedVoucherCode}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">
                            - {discountAmount.toLocaleString()}đ
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveVoucher}
                        className="p-1 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) =>
                            setVoucherCode(e.target.value.toUpperCase())
                          }
                          placeholder="Nhập mã giảm giá"
                          className="flex-1 p-2 sm:p-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl font-bold uppercase focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                        <button
                          onClick={handleApplyVoucher}
                          disabled={isApplyingVoucher || !voucherCode.trim()}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1e3a8a] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors shrink-0"
                        >
                          Áp dụng
                        </button>
                      </div>
                      {voucherError && (
                        <p className="text-red-500 text-[9px] sm:text-[10px] font-semibold mt-2 px-1">
                          {voucherError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-end gap-2">
                    <span className="text-gray-400 text-[9px] sm:text-[11px] font-bold uppercase">
                      Tổng cộng
                    </span>
                    <div className="text-right">
                      {discountAmount > 0 && (
                        <p className="text-xs sm:text-sm text-gray-400 line-through font-bold mb-1">
                          {(
                            price * guestSizeFromState.adult +
                            price * 0.6 * guestSizeFromState.children
                          ).toLocaleString()}
                          đ
                        </p>
                      )}
                      <p className="text-lg sm:text-2xl font-black text-orange-500 tracking-tighter">
                        {totalPrice?.toLocaleString()}đ
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium italic">
                        Đã bao gồm VAT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg sm:rounded-2xl flex gap-2 sm:gap-3 items-start">
                <AlertCircle className="text-orange-500 shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px] mt-0.5" />
                <p className="text-[10px] sm:text-[11px] text-orange-800 leading-relaxed font-medium">
                  Vui lòng kiểm tra kỹ thông tin. Nhân viên sẽ liên hệ xác nhận
                  trong 15 phút.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
