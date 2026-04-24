import React, { useState, useEffect } from "react";
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
} from "lucide-react";
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
  const { formData, totalPrice, isSubmitting, handleChange, handleSubmit } =
    useBooking(
      tour,
      scheduleId,
      guestSizeFromState,
      initialTotalPrice,
      paymentMethod,
    );

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            Xác Nhận Đặt Chỗ
          </h1>
          <p className="text-gray-600 mt-2 italic">
            Hành trình: <span className="font-bold text-blue-600">{title}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin ngày khởi hành - Sửa lỗi Invalid Date */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">
                      Ngày khởi hành:
                    </p>
                    <p className="text-lg font-bold text-blue-900">
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
                            <span className="block text-sm font-semibold text-blue-700 mt-1">
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

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <User size={18} /> Thông tin liên lạc
                  </h3>
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      placeholder="Họ và tên người đại diện"
                      className="w-full p-4 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="Email nhận vé"
                        className="w-full p-4 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all pl-12"
                        required
                      />
                      <Mail
                        className="absolute left-4 top-4 text-gray-400"
                        size={20}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="Số điện thoại"
                        className="w-full p-4 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all pl-12"
                        required
                      />
                      <Phone
                        className="absolute left-4 top-4 text-gray-400"
                        size={20}
                      />
                    </div>
                  </div>
                </div>

                {/* Phần ghi chú */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" /> Ghi
                    chú đặc biệt
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests || ""}
                    onChange={handleChange}
                    placeholder="Ví dụ: Yêu cầu phòng khách sạn, dị ứng thực phẩm..."
                    rows="3"
                    className="w-full p-4 border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none resize-none transition-all"
                  ></textarea>
                </div>

                <PaymentMethod
                  selected={paymentMethod}
                  onChange={setPaymentMethod}
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#1e3a8a] text-white rounded-[1.5rem] font-black text-xl hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-95 disabled:bg-gray-400"
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác Nhận Đặt Ngay"}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar tóm tắt giá chi tiết */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] shadow-xl p-7 border border-white sticky top-5 space-y-6">
              <h3 className="font-black text-[#1e3a8a] border-b border-gray-50 pb-4 uppercase tracking-tight">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users size={16} /> Người lớn (x{guestSizeFromState.adult})
                  </div>
                  <span className="font-bold">
                    {(price * guestSizeFromState.adult).toLocaleString()}đ
                  </span>
                </div>

                {guestSizeFromState.children > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Baby size={16} /> Trẻ em (x{guestSizeFromState.children})
                    </div>
                    <span className="font-bold text-emerald-600">
                      {(
                        price *
                        0.6 *
                        guestSizeFromState.children
                      ).toLocaleString()}
                      đ
                    </span>
                  </div>
                )}

                <div className="pt-5 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-400 text-xs font-bold uppercase">
                      Tổng cộng
                    </span>
                    <div className="text-right">
                      <p className="text-2xl font-black text-orange-500 tracking-tighter">
                        {totalPrice?.toLocaleString()}đ
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium italic">
                        Đã bao gồm VAT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="text-orange-500 shrink-0" size={18} />
                <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
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
