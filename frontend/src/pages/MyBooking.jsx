import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Eye,
  Filter,
  Search,
  User,
  AlertCircle,
  PlaneTakeoff,
  CheckCircle2,
  MessageSquareText,
} from "lucide-react";
import useMyBookings from "../hooks/useMyBooking";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { getBookingShortCodeHash } from "../utils/bookingCode.js";
import {
  cancelBooking,
  cancelExpiredBooking,
  getReviewedBookingIds,
  submitReview,
} from "../services";
import {
  formatCountdown,
  getPendingDeadline,
  getStatusInfo,
  getTravelStatus,
} from "./my-booking/bookingHelpers";
import ReviewModal from "./my-booking/ReviewModal";

const MyBooking = () => {
  const { backendUrl, notifyReviewUpdated } = useContext(AppContext);
  const { bookings, loading, error, refetchBookings } = useMyBookings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [autoCancellingBookingIds, setAutoCancellingBookingIds] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
    survey: {
      guide: "Hài lòng",
      transport: "Hài lòng",
      food: "Hài lòng",
      schedule: "Hài lòng",
    },
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviewedBookings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const data = await getReviewedBookingIds({ backendUrl, token });
        if (data.success) {
          setReviewedBookingIds(data.bookingIds || []);
        }
      } catch {
        console.log("Không tải được danh sách booking đã review");
      }
    };
    fetchReviewedBookings();
  }, [backendUrl, bookings]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const pendingExpiredBookings = bookings.filter((booking) => {
      const deadlineTimestamp = getPendingDeadline(booking);
      return (
        deadlineTimestamp &&
        deadlineTimestamp <= countdownNow &&
        !autoCancellingBookingIds.includes(booking._id)
      );
    });

    if (!pendingExpiredBookings.length) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const runAutoCancel = async () => {
      setAutoCancellingBookingIds((prev) => [
        ...prev,
        ...pendingExpiredBookings.map((item) => item._id),
      ]);

      let hasAnyCancelled = false;
      for (const booking of pendingExpiredBookings) {
        try {
          const data = await cancelExpiredBooking({
            backendUrl,
            token,
            bookingId: booking._id,
          });
          if (data.success) {
            hasAnyCancelled = true;
            toast.info(
              data.message ||
                "Đơn hàng của bạn đã bị hủy tự động do quá hạn thanh toán",
            );
          }
        } catch (error) {
          toast.error(
            error.response?.data?.message ||
              "Không thể tự động cập nhật trạng thái đơn hàng",
          );
        } finally {
          setAutoCancellingBookingIds((prev) =>
            prev.filter((id) => id !== booking._id),
          );
        }
      }

      if (hasAnyCancelled) {
        await refetchBookings();
      }
    };

    runAutoCancel();
  }, [
    bookings,
    countdownNow,
    backendUrl,
    autoCancellingBookingIds,
    refetchBookings,
  ]);

  const handleCancelRequest = async (bookingId) => {
    if (
      !window.confirm("Bạn có chắc chắn muốn gửi yêu cầu hủy tour này không?")
    )
      return;
    try {
      const token = localStorage.getItem("token");
      const res = await cancelBooking({ backendUrl, token, bookingId });
      if (res.success) {
        toast.success("Đã gửi yêu cầu hủy thành công!");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi yêu cầu hủy");
    }
  };

  const filteredBookings =
    bookings?.filter((booking) => {
      const matchesSearch =
        booking.tourTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.name?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus =
        statusFilter === "all" ||
        booking.status?.toLowerCase() === statusFilter;

      if (statusFilter === "ongoing") {
        matchesStatus =
          booking.status === "confirmed" &&
          getTravelStatus(booking.bookAt, booking.tourId?.duration) ===
            "ONGOING";
      }

      if (statusFilter === "completed") {
        matchesStatus =
          booking.status === "confirmed" &&
          getTravelStatus(booking.bookAt, booking.tourId?.duration) ===
            "COMPLETED";
      }

      return matchesSearch && matchesStatus;
    }) || [];

  const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-12 bg-slate-200 rounded-2xl w-1/3 mb-8 mx-auto"></div>
        <div className="h-64 bg-slate-200 rounded-3xl shadow-sm"></div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
        <Calendar size={28} />
      </div>
      <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
        Không tìm thấy lịch đặt chỗ
      </h3>
      <p className="text-slate-500 mb-6">
        {searchTerm || statusFilter !== "all"
          ? "Hãy thử điều chỉnh lại bộ lọc"
          : "Bạn chưa có lịch đặt chỗ nào."}
      </p>
      <button
        onClick={() => {
          setSearchTerm("");
          setStatusFilter("all");
        }}
        className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700"
      >
        Xóa bộ lọc
      </button>
    </div>
  );

  const ErrorState = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-bold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Thử lại
        </button>
      </div>
    </div>
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewForm({
      rating: 5,
      comment: "",
      survey: {
        guide: "Hài lòng",
        transport: "Hài lòng",
        food: "Hài lòng",
        schedule: "Hài lòng",
      },
      images: [],
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking?._id) return;
    try {
      setSubmittingReview(true);
      const token = localStorage.getItem("token");
      const data = await submitReview({
        backendUrl,
        token,
        bookingId: selectedBooking._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        survey: reviewForm.survey,
        images: reviewForm.images,
      });
      if (!data.success) {
        toast.error(data.message || "Không thể gửi đánh giá");
        return;
      }
      toast.success("Đánh giá đã được gửi thành công");
      setReviewedBookingIds((prev) => [
        ...new Set([...prev, selectedBooking._id]),
      ]);
      notifyReviewUpdated?.();
      setShowReviewModal(false);
      setSelectedBooking(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-blue-100 bg-white/85 backdrop-blur-sm px-4 sm:px-6 md:px-10 py-6 sm:py-10 mb-6 sm:mb-8 shadow-sm text-center">
          <div className="absolute -top-10 -right-8 w-48 h-48 rounded-full bg-blue-100/70 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-indigo-100/60 blur-2xl" />
          <div className="relative">
            <div className="inline-block mb-3 sm:mb-4">
              <span className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-md">
                Lịch sử du lịch của bạn
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-3 sm:mb-4">
              Chuyến đi của{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tôi
              </span>
            </h1>
            <p className="text-xs sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Theo dõi và quản lý tất cả lịch đặt chỗ du lịch của bạn tại một
              nơi duy nhất
            </p>
          </div>
        </div>

        {/* Filter Section */}
        {bookings && bookings.length > 0 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative w-full">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên tour..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter size={18} className="text-slate-500 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50/60 focus:border-blue-500 outline-none font-semibold text-slate-700"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="ongoing">Đang diễn ra</option>
                  <option value="completed">Đã kết thúc</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="cancel_pending">Đang chờ hủy</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-500">
                Đang hiển thị <b>{filteredBookings.length}</b> đơn đặt chỗ
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {filteredBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking);
                const StatusIcon = statusInfo.icon;
                const deadlineTimestamp = getPendingDeadline(booking);
                const remainingMs = deadlineTimestamp
                  ? deadlineTimestamp - countdownNow
                  : null;
                const isUrgentDeadline =
                  remainingMs !== null &&
                  remainingMs > 0 &&
                  remainingMs <= 3600000;
                const isAutoCancelling = autoCancellingBookingIds.includes(
                  booking._id,
                );

                // Xác định travelStatus để chặn nút hủy nếu đang đi hoặc đã xong
                const travelStatus = getTravelStatus(
                  booking.bookAt,
                  booking.tourId?.duration || 1,
                );
                const isCompleted = travelStatus === "COMPLETED";
                const isReviewed = reviewedBookingIds.includes(booking._id);

                // --- LOGIC HỦY ĐÃ FIX ---
                // Chỉ cho phép hủy khi:
                // 1. Status là 'pending'
                // 2. Status là 'confirmed' NHƯNG travelStatus phải là 'UPCOMING' (không đang diễn ra/đã xong)
                const canCancel =
                  booking.status?.toLowerCase() === "pending" ||
                  (booking.status?.toLowerCase() === "confirmed" &&
                    travelStatus === "UPCOMING");

                return (
                  <div
                    key={booking._id}
                    className={`p-4 transition-colors hover:bg-blue-50/30 sm:p-6 md:p-7 ${isCompleted ? "opacity-90" : ""}`}
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3
                              className={`mb-1 text-xl font-black sm:text-2xl ${isCompleted ? "text-slate-500" : "text-slate-800"}`}
                            >
                              {booking.tourTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-slate-500">Mã:</span>
                              <span className="font-mono font-black text-blue-600">
                                {getBookingShortCodeHash(booking._id)}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex w-fit shrink-0 items-center gap-2 self-start rounded-full px-3 py-1 sm:self-auto ${statusInfo.bgColor}`}
                          >
                            <StatusIcon
                              size={16}
                              className={statusInfo.color}
                            />
                            <span
                              className={`text-sm font-bold ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {remainingMs !== null && remainingMs > 0 && (
                          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm font-semibold text-red-700">
                              Giữ chỗ của bạn đã được đảm bảo! Vui lòng hoàn tất
                              thanh toán trong{" "}
                              <span
                                className={`font-black tracking-wide ${isUrgentDeadline ? "text-red-600 animate-pulse" : "text-red-700"}`}
                              >
                                {formatCountdown(remainingMs)}
                              </span>{" "}
                              để giữ mức giá ưu đãi này. Sau thời gian này, hệ
                              thống sẽ tự động giải phóng chỗ.
                            </p>
                          </div>
                        )}

                        {remainingMs !== null && remainingMs <= 0 && (
                          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm font-semibold text-red-700">
                              Đơn giữ chỗ đã hết hạn.{" "}
                              <span className="font-black tracking-wide text-red-600 animate-pulse">
                                00:00:00
                              </span>{" "}
                              {isAutoCancelling
                                ? "Hệ thống đang tự động hủy đơn..."
                                : "Đang chờ cập nhật trạng thái hủy tự động."}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                            <User size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500 leading-none">
                                Khách hàng
                              </p>
                              <p className="font-semibold text-slate-700">
                                {booking.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                            <Users size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500 leading-none">
                                Số người
                              </p>
                              <p className="font-semibold text-slate-700">
                                {booking.guestSize?.adult || 1} lớn,{" "}
                                {booking.guestSize?.children || 0} trẻ
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                            <CreditCard size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500 leading-none">
                                Tổng tiền
                              </p>
                              <p className="font-black text-emerald-600">
                                {booking.totalPrice?.toLocaleString("vi-VN")}{" "}
                                VNĐ
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                            <Calendar size={16} className="text-slate-400" />
                            <div>
                              <p className="text-xs text-slate-500 leading-none">
                                Khởi hành
                              </p>
                              <p className="font-black text-blue-600">
                                {new Date(booking.bookAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-4">
                          <span className="flex min-w-0 items-center gap-1.5 break-all">
                            <Mail size={14} className="shrink-0" /> {booking.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone size={14} className="shrink-0" /> {booking.phone}
                          </span>
                        </div>

                        {booking.specialRequests && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 text-sm">
                            <b className="text-blue-800">Yêu cầu:</b>{" "}
                            <i className="text-blue-700">
                              "{booking.specialRequests}"
                            </i>
                          </div>
                        )}

                        {booking.status?.toLowerCase() === "cancelled" &&
                          booking.cancellationReason && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400 text-sm">
                              <b className="text-red-800">Lý do hủy:</b>{" "}
                              <span className="text-red-700">
                                {booking.cancellationReason}
                              </span>
                            </div>
                          )}
                      </div>

                      <div className="flex w-full flex-col gap-2.5 lg:w-auto lg:min-w-[180px]">
                        <button
                          onClick={() =>
                            navigate("/invoice", { state: { booking } })
                          }
                          className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={18} /> Xem chi tiết
                        </button>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(booking._id)}
                            className="bg-white border-2 border-red-200 text-red-600 font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={18} /> Huỷ Tour
                          </button>
                        )}
                        {isCompleted &&
                          booking.status?.toLowerCase() === "confirmed" && (
                            <button
                              onClick={() =>
                                isReviewed
                                  ? navigate(
                                      `/tours/${booking.tourId?._id || booking.tourId}`,
                                    )
                                  : openReviewModal(booking)
                              }
                              className={`font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 border transition ${
                                isReviewed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              }`}
                            >
                              <MessageSquareText size={18} />
                              {isReviewed
                                ? "Xem đánh giá"
                                : "Đánh giá chuyến đi"}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Card */}
        {bookings && bookings.length > 0 && (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] p-5 text-white shadow-lg sm:mt-8 sm:rounded-3xl sm:p-8">
            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3 md:gap-8">
              <div>
                <p className="text-4xl font-black mb-1">{bookings.length}</p>
                <p className="text-blue-100 text-xs uppercase tracking-widest font-bold">
                  Tổng chuyến đi
                </p>
              </div>
              <div>
                <p className="text-4xl font-black mb-1">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
                <p className="text-blue-100 text-xs uppercase tracking-widest font-bold">
                  Đã xác nhận
                </p>
              </div>
              <div>
                <p className="text-4xl font-black mb-1 text-amber-200">
                  {bookings
                    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
                    .toLocaleString("vi-VN")}{" "}
                  VNĐ
                </p>
                <p className="text-blue-100 text-xs uppercase tracking-widest font-bold">
                  Tổng chi tiêu
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showReviewModal && selectedBooking && (
        <ReviewModal
          selectedBooking={selectedBooking}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          setShowReviewModal={setShowReviewModal}
          handleSubmitReview={handleSubmitReview}
          submittingReview={submittingReview}
        />
      )}
    </div>
  );
};

export default MyBooking;
