import React, { useState } from "react";
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
  Download,
  Eye,
  Filter,
  Search,
  User,
} from "lucide-react";
import useMyBookings from "../hooks/useMyBooking";

const MyBooking = () => {
  const { bookings, loading, error } = useMyBookings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Đã xác nhận",
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          label: "Chờ xử lý",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          label: "Đã hủy",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          label: "Không xác định",
        };
    }
  };

  // Lọc danh sách đặt chỗ
  const filteredBookings =
    bookings?.filter((booking) => {
      const matchesSearch =
        booking.tourTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        booking.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  const LoadingState = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📅</div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-2">
        Không tìm thấy lịch đặt chỗ
      </h3>
      <p className="text-gray-600 mb-6">
        {searchTerm || statusFilter !== "all"
          ? "Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc"
          : "Bạn chưa có lịch đặt chỗ nào. Hãy bắt đầu khám phá các chuyến đi của chúng tôi!"}
      </p>
      {(searchTerm || statusFilter !== "all") && (
        <button
          onClick={() => {
            setSearchTerm("");
            setStatusFilter("all");
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );

  const ErrorState = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Rất tiếc! Đã có lỗi xảy ra
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
              Lịch sử du lịch của bạn
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Chuyến đi của{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tôi
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Theo dõi và quản lý tất cả lịch đặt chỗ du lịch của bạn tại một nơi duy nhất
          </p>
        </div>

        {/* Search and Filter Section */}
        {bookings && bookings.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên tour hoặc khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 font-medium"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Đang hiển thị{" "}
                <span className="font-semibold text-gray-800">
                  {filteredBookings.length}
                </span>{" "}
                trên tổng số{" "}
                <span className="font-semibold text-gray-800">
                  {bookings.length}
                </span>{" "}
                đơn đặt chỗ
              </p>
            </div>
          </div>
        )}

        {/* Bookings Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          {!bookings || bookings.length === 0 ? (
            <EmptyState />
          ) : filteredBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBookings.map((booking, index) => {
                const statusInfo = getStatusInfo(booking.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={booking._id}
                    className="p-6 hover:bg-gray-50/50 transition-colors duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      {/* Left Section - Tour Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                              {booking.tourTitle}
                            </h3>
                            <div className="flex items-center space-x-1 text-gray-500 text-sm">
                              <span>Mã đặt chỗ:</span>
                              <span className="font-mono font-semibold text-blue-600">
                                #{booking._id.slice(-8).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}
                          >
                            <StatusIcon
                              size={16}
                              className={statusInfo.color}
                            />
                            <span
                              className={`text-sm font-semibold ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Booking Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-gray-400" />
                            <div>
                              <div className="text-gray-500">Khách hàng</div>
                              <div className="font-semibold text-gray-800">
                                {booking.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Users size={16} className="text-gray-400" />
                            <div>
                              <div className="text-gray-500">Số người</div>
                              <div className="font-semibold text-gray-800">
                                {booking.travelers} người
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <CreditCard size={16} className="text-gray-400" />
                            <div>
                              <div className="text-gray-500">Tổng tiền</div>
                              <div className="font-bold text-green-600 text-base">
                                {booking.totalPrice?.toLocaleString('vi-VN')} VNĐ
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <div>
                              <div className="text-gray-500">Ngày đặt</div>
                              <div className="font-semibold text-gray-800">
                                {new Date(booking.createdAt).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mt-4 flex flex-wrap items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail size={14} />
                            <span>{booking.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone size={14} />
                            <span>{booking.phone}</span>
                          </div>
                        </div>

                        {/* Special Requests */}
                        {booking.specialRequests && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <div className="text-sm">
                              <span className="font-semibold text-blue-800">
                                Yêu cầu đặc biệt:{" "}
                              </span>
                              <span className="text-blue-700 italic">
                                "{booking.specialRequests}"
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col space-y-2 lg:ml-6">
                        <button
                          onClick={() =>
                            navigate("/invoice", {
                              state: { booking },
                            })
                          }
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <Eye size={16} />
                          <span>Xem chi tiết</span>
                        </button>

                        <button className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2">
                          <Download size={16} />
                          <span>Tải về</span>
                        </button>
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
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <div className="text-blue-100 uppercase text-xs tracking-wider mt-1">Tổng lượt đặt</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </div>
                <div className="text-blue-100 uppercase text-xs tracking-wider mt-1">Đã xác nhận</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300">
                  {bookings
                    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
                    .toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="text-blue-100 uppercase text-xs tracking-wider mt-1">Tổng chi tiêu</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooking;
