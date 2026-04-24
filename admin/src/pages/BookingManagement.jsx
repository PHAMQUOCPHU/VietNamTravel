import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useContext,
  useRef,
} from "react";
import axios from "axios";
import {
  Clock,
  Eye,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Mail,
  Phone,
  Users,
  CreditCard,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";
import { getBookingShortCodeHash } from "../utils/bookingCode.js";

/** Chuỗi YYYY-MM-DD theo giờ local — so khớp ngày khởi hành */
function toLocalDateKey(isoOrDate) {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Tách ra ngoài component — không tạo lại hàm mỗi lần render */
function getTravelStatus(bookAt, duration) {
  if (!bookAt) return "UPCOMING";
  const now = new Date();
  const startDate = new Date(bookAt);
  if (Number.isNaN(startDate.getTime())) return "UPCOMING";
  startDate.setHours(0, 0, 0, 0);
  const days = Number(duration) || 1;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (days - 1));
  endDate.setHours(23, 59, 59, 999);

  if (now < startDate) return "UPCOMING";
  if (now >= startDate && now <= endDate) return "ONGOING";
  return "COMPLETED";
}

const TAB_ITEMS = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xử lý" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "ongoing", label: "Đang diễn ra" },
  { id: "completed", label: "Đã kết thúc" },
  { id: "cancel_pending", label: "Cần duyệt hủy" },
  { id: "cancelled", label: "Đã hủy" },
];

function StatusBadge({ booking }) {
  const status = booking.status?.toLowerCase();

  if (status === "confirmed") {
    const travelStatus = getTravelStatus(
      booking.bookAt,
      booking.tourId?.duration,
    );
    if (travelStatus === "ONGOING") {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border-blue-200 whitespace-nowrap">
          Đang diễn ra
        </span>
      );
    }
    if (travelStatus === "COMPLETED") {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border-slate-200 whitespace-nowrap">
            Đã kết thúc
          </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border-emerald-200 whitespace-nowrap">
        Đã xác nhận
      </span>
    );
  }

  const config = {
    pending: {
      label: "Chờ xử lý",
      class: "bg-amber-100 text-amber-700 border-amber-200",
    },
    cancel_pending: {
      label: "Yêu cầu hủy",
      class: "bg-orange-100 text-orange-700 border-orange-200",
    },
    cancelled: {
      label: "Đã hủy",
      class: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const item = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${item.class}`}
    >
      {item.label}
    </span>
  );
}

const BookingCalendar = memo(function BookingCalendar({
  viewDate,
  onPrevMonth,
  onNextMonth,
  selectedDateKey,
  onToggleDay,
  countsByDay,
}) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const pad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const todayKey = toLocalDateKey(new Date());

  const cells = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  const title = viewDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Tháng trước"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-sm font-black text-slate-800 capitalize text-center flex-1">
          {title}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Tháng sau"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`e-${idx}`} className="aspect-square" />;
          }
          const key = toLocalDateKey(new Date(year, month, dayNum));
          const count = key ? countsByDay[key] || 0 : 0;
          const isSelected = key && selectedDateKey === key;
          const isToday = key && todayKey === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => key && onToggleDay(key)}
              className={`
                aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-colors
                ${isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "hover:bg-blue-50 text-slate-700"}
                ${!isSelected && isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                ${!isSelected && count > 0 ? "bg-slate-50" : ""}
              `}
            >
              <span>{dayNum}</span>
              {count > 0 && (
                <span
                  className={`text-[9px] font-black leading-none px-1 rounded-full min-w-[1rem] ${
                    isSelected ? "bg-white/25 text-white" : "bg-blue-500 text-white"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-slate-500 leading-relaxed">
        Số trên ô là số đơn có{" "}
        <span className="font-bold text-slate-700">ngày khởi hành</span> trùng
        ngày đó. Bấm ngày để lọc danh sách; bấm lại để bỏ lọc.
      </p>
    </div>
  );
});

const BookingRow = memo(function BookingRow({
  item,
  onStatusUpdate,
  onViewDetail,
}) {
  return (
    <tr className="border-b border-slate-100/80 last:border-0 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-blue-50/30 transition-colors duration-200 group align-top">
      <td className="px-4 py-4 sm:px-5 align-top">
        <div className="inline-flex flex-col gap-1">
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 ring-1 ring-slate-200/80">
            {getBookingShortCodeHash(item._id)}
          </span>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Clock size={12} className="shrink-0 opacity-70" />
            {new Date(item.createdAt).toLocaleString("vi-VN")}
          </div>
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5 align-top">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-200/50 ring-2 ring-white">
            {item.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">
              {item.name}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {item.phone || "—"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5 align-top">
        <div className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
          {item.tourTitle}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 font-medium text-slate-600 ring-1 ring-slate-100">
            <Calendar size={12} className="text-sky-600 shrink-0" />
            {new Date(item.bookAt).toLocaleDateString("vi-VN")}
          </span>
          <span className="font-semibold text-sky-700">
            {item.totalPrice?.toLocaleString("vi-VN")}₫
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {item.paymentMethod}
          </span>
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5 text-center align-middle">
        <div className="flex justify-center">
          <StatusBadge booking={item} />
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5 text-right align-middle">
        <div className="flex flex-nowrap items-center justify-end gap-1 sm:gap-1.5">
          <button
            type="button"
            title="Xem chi tiết"
            onClick={() => onViewDetail(item)}
            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all ring-1 ring-transparent hover:ring-sky-100 active:scale-95 shrink-0"
          >
            <Eye size={18} />
          </button>
          {item.status === "cancel_pending" && (
            <button
              type="button"
              onClick={() => onStatusUpdate(item._id, "cancelled")}
              className="px-2.5 py-2 sm:px-3 bg-rose-600 text-white rounded-xl text-[10px] sm:text-[11px] font-bold hover:bg-rose-700 shadow-sm flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <XCircle size={14} className="shrink-0" />
              <span className="hidden sm:inline">Duyệt hủy</span>
            </button>
          )}
          {item.status === "pending" && (
            <button
              type="button"
              onClick={() => onStatusUpdate(item._id, "confirmed")}
              className="px-2.5 py-2 sm:px-3 bg-sky-600 text-white rounded-xl text-[10px] sm:text-[11px] font-bold hover:bg-sky-700 shadow-sm flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <CheckCircle2 size={14} className="shrink-0" />
              <span className="hidden sm:inline">Xác nhận</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

function BookingDetailModal({ booking, onClose, onStatusUpdate }) {
  useEffect(() => {
    if (!booking) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booking, onClose]);

  if (!booking) return null;

  const adults = booking.guestSize?.adult ?? 1;
  const children = booking.guestSize?.children ?? 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/40 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Chi tiết đặt tour
            </p>
            <h2
              id="booking-detail-title"
              className="mt-0.5 truncate text-lg font-bold text-slate-900"
            >
              {booking.tourTitle}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-500">
              Mã đơn: {getBookingShortCodeHash(booking._id)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge booking={booking} />
            {booking.paymentStatus ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                Đã thanh toán
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                Chưa thanh toán
              </span>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Khách hàng</p>
                <p className="font-semibold text-slate-900">{booking.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Email</p>
                <p className="break-all text-sm text-slate-800">
                  {booking.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Điện thoại</p>
                <p className="text-sm text-slate-800">{booking.phone}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Ngày khởi hành
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(booking.bookAt).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-slate-500">Số khách</p>
                <p className="text-sm font-semibold text-slate-900">
                  {adults} người lớn
                  {children > 0 ? ` · ${children} trẻ em` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-xs font-medium text-slate-500">
                  Tổng & hình thức
                </p>
                <p className="text-base font-bold text-sky-700">
                  {booking.totalPrice?.toLocaleString("vi-VN")}₫
                </p>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                  {booking.paymentMethod}
                </span>
              </div>
            </div>
            {booking.specialRequests ? (
              <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Ghi chú</p>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {booking.specialRequests}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Đóng
          </button>
          {booking.status === "cancel_pending" && (
            <button
              type="button"
              onClick={() => onStatusUpdate(booking._id, "cancelled", onClose)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
            >
              <XCircle size={16} />
              Duyệt hủy
            </button>
          )}
          {booking.status === "pending" && (
            <button
              type="button"
              onClick={() => onStatusUpdate(booking._id, "confirmed", onClose)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700"
            >
              <CheckCircle2 size={16} />
              Xác nhận đơn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const HORIZONTAL_SCROLL_STEP = 140;

const BookingManagement = () => {
  const { backendUrl, aToken } = useContext(AdminContext);
  const authToken = aToken || localStorage.getItem("adminToken");
  const tableScrollRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  /** null = không lọc theo ngày; YYYY-MM-DD = chỉ đơn có bookAt cùng ngày (local) */
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [calendarView, setCalendarView] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  /** Đếm đơn theo ngày khởi hành (toàn bộ đơn — dùng cho badge trên lịch) */
  const departureCountsByDay = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const k = toLocalDateKey(b.bookAt);
      if (k) map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [bookings]);

  const tabCounts = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const cancelPending = bookings.filter(
      (b) => b.status === "cancel_pending",
    ).length;
    const ongoing = bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        getTravelStatus(b.bookAt, b.tourId?.duration) === "ONGOING",
    ).length;
    const completedTravel = bookings.filter(
      (b) =>
        b.status === "confirmed" &&
        getTravelStatus(b.bookAt, b.tourId?.duration) === "COMPLETED",
    ).length;
    return {
      all: bookings.length,
      pending,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      ongoing,
      completed: completedTravel,
      cancel_pending: cancelPending,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      needsAction: pending + cancelPending,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let results = bookings;

    if (activeTab !== "all") {
      if (activeTab === "ongoing") {
        results = results.filter(
          (item) =>
            item.status === "confirmed" &&
            getTravelStatus(item.bookAt, item.tourId?.duration) === "ONGOING",
        );
      } else if (activeTab === "completed") {
        results = results.filter(
          (item) =>
            item.status === "confirmed" &&
            getTravelStatus(item.bookAt, item.tourId?.duration) === "COMPLETED",
        );
      } else {
        results = results.filter((item) => item.status === activeTab);
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      results = results.filter((item) => {
        const idStr = String(item._id ?? "").toLowerCase();
        return (
          idStr.includes(q) ||
          item.name?.toLowerCase().includes(q) ||
          item.tourTitle?.toLowerCase().includes(q)
        );
      });
    }

    if (selectedDateKey) {
      results = results.filter(
        (item) => toLocalDateKey(item.bookAt) === selectedDateKey,
      );
    }

    return results;
  }, [bookings, activeTab, searchTerm, selectedDateKey]);

  const filteredTotalValue = useMemo(
    () =>
      filteredBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0),
    [filteredBookings],
  );

  const handleToggleCalendarDay = useCallback((dayKey) => {
    setSelectedDateKey((prev) => (prev === dayKey ? null : dayKey));
  }, []);

  const goPrevMonth = useCallback(() => {
    setCalendarView((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const goNextMonth = useCallback(() => {
    setCalendarView((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const clearDateFilter = useCallback(() => setSelectedDateKey(null), []);

  const handlePickToday = useCallback(() => {
    const n = new Date();
    setCalendarView(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelectedDateKey(toLocalDateKey(n));
  }, []);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateKey) return "";
    const [y, m, day] = selectedDateKey.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [selectedDateKey]);

  const fetchAllBookings = useCallback(
    async (opts = {}) => {
      const { silent } = opts;
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        const response = await axios.get(`${backendUrl}/api/bookings/all`, {
          headers: { token: authToken },
        });

        if (response.data.success) {
          setBookings(
            Array.isArray(response.data.bookings) ? response.data.bookings : [],
          );
        } else {
          toast.error(response.data?.message || "Không tải được danh sách đơn");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi kết nối Server");
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [backendUrl, authToken],
  );

  const handleExportCsv = useCallback(() => {
    if (!filteredBookings.length) {
      toast.info("Không có đơn trong danh sách hiện tại để xuất.");
      return;
    }
    const headers = [
      "Ma_don",
      "Ten_khach",
      "Email",
      "Dien_thoai",
      "Tour",
      "Ngay_khoi_hanh",
      "Tong_tien",
      "Phuong_thuc_TT",
      "Trang_thai_db",
    ];
    const rows = filteredBookings.map((b) => {
      const travel =
        b.status === "confirmed"
          ? getTravelStatus(b.bookAt, b.tourId?.duration)
          : "";
      const statusLabel =
        travel === "ONGOING"
          ? "dang_dien_ra"
          : travel === "COMPLETED"
            ? "da_ket_thuc"
            : (b.status || "").toLowerCase();
      return [
        b._id,
        b.name || "",
        b.email || "",
        b.phone || "",
        (b.tourTitle || "").replaceAll('"', '""'),
        toLocalDateKey(b.bookAt) || "",
        String(b.totalPrice ?? ""),
        b.paymentMethod || "",
        statusLabel,
      ];
    });
    const escape = (cell) => `"${String(cell).replaceAll('"', '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join(
      "\n",
    );
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dat-tour_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải file CSV theo bộ lọc hiện tại.");
  }, [filteredBookings]);

  const handleStatusUpdate = useCallback(
    async (bookingId, newStatus, onAfterSuccess) => {
      const messages = {
        cancelled: "Xác nhận DUYỆT HỦY đơn này? Chỗ ngồi sẽ được hoàn trả.",
        confirmed: "Xác nhận đơn hàng này hợp lệ?",
      };

      if (!window.confirm(messages[newStatus] || "Cập nhật trạng thái?"))
        return;

      try {
        const response = await axios.post(
          `${backendUrl}/api/bookings/update-status`,
          { bookingId: String(bookingId), status: newStatus },
          { headers: { token: authToken } },
        );

        if (response.data.success) {
          toast.success("Cập nhật trạng thái thành công!");
          onAfterSuccess?.();
          fetchAllBookings({ silent: true });
        } else {
          toast.error(response.data?.message || "Không cập nhật được trạng thái");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi cập nhật");
      }
    },
    [backendUrl, authToken, fetchAllBookings],
  );

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

  /** Cuộn ngang bảng bằng phím ← → (không áp khi gõ ô tìm kiếm / khi mở chi tiết đơn) */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        t.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (selectedBooking) return;
      const wrap = tableScrollRef.current;
      if (!wrap) return;
      e.preventDefault();
      wrap.scrollBy({
        left:
          e.key === "ArrowLeft"
            ? -HORIZONTAL_SCROLL_STEP
            : HORIZONTAL_SCROLL_STEP,
        behavior: "smooth",
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBooking]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 py-24 shadow-sm">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-sky-100 border-t-sky-600" />
        <p className="text-sm font-medium text-slate-500">
          Đang tải danh sách đặt tour…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-none space-y-6 pb-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-600">
              Quản trị · Đặt tour
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Quản lý đặt tour
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              Lọc nhanh theo trạng thái và ngày khởi hành, xem chi tiết từng đơn
              và xử lý xác nhận hoặc duyệt hủy ngay trên bảng hoặc trong cửa sổ
              chi tiết.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-end lg:max-w-2xl lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Mã đơn, tên khách, tên tour…"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-sky-100 transition-shadow placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => fetchAllBookings({ silent: true })}
                disabled={refreshing}
                title="Tải lại danh sách"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Xuất CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Tổng đơn</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {tabCounts.all.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Trong toàn hệ thống
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm">
            <p className="text-xs font-medium text-amber-800/90">
              Cần xử lý
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-950">
              {tabCounts.needsAction.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-[11px] text-amber-800/70">
              Chờ xác nhận + yêu cầu hủy
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-4 shadow-sm">
            <p className="text-xs font-medium text-sky-800/90">
              Đang diễn ra
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-sky-950">
              {tabCounts.ongoing.toLocaleString("vi-VN")}
            </p>
            <p className="mt-1 text-[11px] text-sky-800/70">
              Tour đang trong hành trình
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Giá trị danh sách hiện tại
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-sky-700 sm:text-2xl">
              {filteredTotalValue.toLocaleString("vi-VN")}₫
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {filteredBookings.length} đơn sau khi lọc
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
              <div
                className="flex min-w-max gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1"
                role="tablist"
                aria-label="Lọc theo trạng thái"
              >
                {TAB_ITEMS.map((tab) => {
                  const count = tabCounts[tab.id] ?? 0;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all sm:px-3.5 ${
                        active
                          ? "bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/60"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                      }`}
                    >
                      <span className="whitespace-nowrap">{tab.label}</span>
                      <span
                        className={`min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${
                          active
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-200/70 text-slate-600"
                        }`}
                      >
                        {count > 999 ? "999+" : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDateKey && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-sky-950">
                <span className="min-w-0 leading-snug">
                  Lọc theo ngày khởi hành:{" "}
                  <strong className="text-sky-900">{selectedDateLabel}</strong>
                  <span className="ml-2 font-semibold text-sky-700">
                    ({filteredBookings.length} đơn)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="shrink-0 rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-sky-800 transition-colors hover:bg-sky-100"
                >
                  Bỏ lọc ngày
                </button>
              </div>
            )}

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              {refreshing ? (
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-white/50 backdrop-blur-[1px]"
                  aria-hidden
                />
              ) : null}
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Danh sách đơn
                  </h2>
                  <p className="text-xs text-slate-500">
                    {filteredBookings.length} đơn hiển thị · kéo ngang hoặc phím{" "}
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px] text-slate-600">
                      ←
                    </kbd>{" "}
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px] text-slate-600">
                      →
                    </kbd>{" "}
                    để xem đủ cột
                  </p>
                </div>
              </div>

              <div
                ref={tableScrollRef}
                className="overflow-x-auto overscroll-x-contain scroll-smooth"
              >
                <table className="w-full min-w-[1020px] table-fixed border-collapse text-left">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[22%]" />
                    <col className="w-[34%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
                      <th className="px-4 py-3.5 sm:px-5">Mã đơn</th>
                      <th className="px-4 py-3.5 sm:px-5">Khách hàng</th>
                      <th className="px-4 py-3.5 sm:px-5">Tour & thanh toán</th>
                      <th className="px-4 py-3.5 sm:px-5 text-center">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3.5 sm:px-5 text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((item) => (
                      <BookingRow
                        key={item._id}
                        item={item}
                        onStatusUpdate={handleStatusUpdate}
                        onViewDetail={setSelectedBooking}
                      />
                    ))}
                  </tbody>
                </table>

                {filteredBookings.length === 0 ? (
                  <div className="px-4 py-20 text-center sm:py-24">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                      <ClipboardList
                        className="text-slate-300"
                        size={32}
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      Không có đơn phù hợp
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                      {selectedDateKey
                        ? "Thử bỏ lọc ngày, đổi tab trạng thái hoặc xóa từ khóa tìm kiếm."
                        : "Đổi bộ lọc tab hoặc từ khóa tìm kiếm để xem thêm đơn."}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="mx-auto w-full max-w-md shrink-0 space-y-3 xl:mx-0 xl:w-[300px]">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Calendar size={18} />
                </span>
                Lịch khởi hành
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Số trên từng ngày là số đơn có ngày khởi hành trùng ngày đó. Chọn
                ngày để lọc danh sách bên trái.
              </p>
            </div>
            <BookingCalendar
              viewDate={calendarView}
              onPrevMonth={goPrevMonth}
              onNextMonth={goNextMonth}
              selectedDateKey={selectedDateKey}
              onToggleDay={handleToggleCalendarDay}
              countsByDay={departureCountsByDay}
            />
            <button
              type="button"
              onClick={handlePickToday}
              className="w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              Đơn khởi hành hôm nay
            </button>
            {selectedDateKey ? (
              <button
                type="button"
                onClick={clearDateFilter}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 xl:hidden"
              >
                Bỏ lọc ngày
              </button>
            ) : null}
          </aside>
        </div>
      </div>

      {selectedBooking ? (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      ) : null}
    </>
  );
};

export default BookingManagement;
