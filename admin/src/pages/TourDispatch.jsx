import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Fragment,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bus,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { AdminContext } from "../context/AdminContext";
import { listToursApi } from "../api/tourApi";
import { getTourDispatchApi } from "../api/bookingApi";

function todayVnDateKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function formatDepartureDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS = {
  confirmed: { label: "Đã xác nhận", className: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  cancel_pending: { label: "Chờ duyệt hủy", className: "bg-orange-100 text-orange-700" },
};

function StatusPill({ status }) {
  const cfg = STATUS_LABELS[status] || {
    label: status || "—",
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

function SummaryCard({ label, value, icon, accent }) {
  return (
    <div className="border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-600">{label}</p>
          <p className={`mt-2 text-3xl font-extrabold ${accent}`}>
            {value.toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

const TourDispatch = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [searchParams] = useSearchParams();
  const initialTourId = searchParams.get("tourId") || "";

  const [selectedDate, setSelectedDate] = useState(todayVnDateKey());
  const [tourId, setTourId] = useState(initialTourId);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!aToken) return;
    listToursApi(aToken, backendUrl, true)
      .then((res) => {
        if (res.success) setTours(res.tours || []);
      })
      .catch(() => toast.error("Không tải được danh sách tour"));
  }, [aToken, backendUrl]);

  const fetchDispatch = useCallback(async () => {
    if (!aToken) return;
    try {
      setLoading(true);
      const res = await getTourDispatchApi(
        { date: selectedDate, tourId: tourId || undefined },
        aToken,
        backendUrl,
      );
      if (res.success) {
        setData(res);
        setExpandedId(null);
      } else {
        toast.error(res.message || "Không tải được dữ liệu điều phối");
      }
    } catch {
      toast.error("Kết nối server thất bại");
    } finally {
      setLoading(false);
    }
  }, [aToken, backendUrl, selectedDate, tourId]);

  useEffect(() => {
    fetchDispatch();
  }, [fetchDispatch]);

  const summary = data?.summary || {
    departureSlots: 0,
    slotsWithBookings: 0,
    totalBookings: 0,
    totalPassengers: 0,
    totalSuggestedVehicles: 0,
    totalSuggestedGuides: 0,
  };

  const departures = data?.departures || [];

  const selectedTourTitle = useMemo(() => {
    if (!tourId) return null;
    return tours.find((t) => t._id === tourId)?.title || null;
  }, [tourId, tours]);

  return (
    <div className="m-5 w-full max-w-6xl animate-in fade-in duration-500 space-y-6">
      <div className="overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 px-8 py-7 shadow-xl shadow-blue-100/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Điều phối tour
            </h1>
            <p className="mt-1 text-sm font-semibold text-blue-100/90">
              Theo dõi số đơn, số khách theo ngày khởi hành — hỗ trợ bố trí xe,
              hướng dẫn viên
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-white/15 ring-1 ring-white/20">
            <Bus className="text-white" size={22} strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Ngày khởi hành
          </label>
          <div className="relative">
            <Calendar
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Tour
          </label>
          <select
            value={tourId}
            onChange={(e) => setTourId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tất cả tour</option>
            {tours.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} — {t.city}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={fetchDispatch}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Làm mới
        </button>
      </div>

      {selectedTourTitle && (
        <p className="text-sm font-semibold text-slate-600">
          Đang lọc:{" "}
          <span className="text-blue-600">{selectedTourTitle}</span> · ngày{" "}
          <span className="text-blue-600">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("vi-VN")}
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Chuyến khởi hành"
          value={summary.departureSlots}
          icon={<Calendar size={18} />}
          accent="text-slate-900"
        />
        <SummaryCard
          label="Chuyến có khách"
          value={summary.slotsWithBookings}
          icon={<ClipboardList size={18} />}
          accent="text-blue-600"
        />
        <SummaryCard
          label="Tổng đơn đặt"
          value={summary.totalBookings}
          icon={<ClipboardList size={18} />}
          accent="text-indigo-600"
        />
        <SummaryCard
          label="Tổng khách"
          value={summary.totalPassengers}
          icon={<Users size={18} />}
          accent="text-emerald-600"
        />
        <SummaryCard
          label="Xe gợi ý (16 chỗ)"
          value={summary.totalSuggestedVehicles}
          icon={<Bus size={18} />}
          accent="text-amber-600"
        />
        <SummaryCard
          label="HDV gợi ý"
          value={summary.totalSuggestedGuides}
          icon={<UserRound size={18} />}
          accent="text-violet-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-3 text-slate-500">
            <Loader2 className="animate-spin" size={24} />
            <span className="font-semibold">Đang tải dữ liệu điều phối…</span>
          </div>
        ) : departures.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
            <Calendar size={40} className="text-slate-300" />
            <p className="font-bold text-slate-700">
              Không có chuyến khởi hành trong ngày này
            </p>
            <p className="text-sm text-slate-500">
              Chọn ngày khác hoặc thêm lịch khởi hành trong phần chỉnh sửa tour.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="p-4 text-[11px] font-extrabold uppercase text-slate-400">
                    Tour / Khởi hành
                  </th>
                  <th className="p-4 text-center text-[11px] font-extrabold uppercase text-slate-400">
                    Đơn
                  </th>
                  <th className="p-4 text-center text-[11px] font-extrabold uppercase text-slate-400">
                    Khách
                  </th>
                  <th className="p-4 text-center text-[11px] font-extrabold uppercase text-slate-400">
                    Sức chứa
                  </th>
                  <th className="p-4 text-center text-[11px] font-extrabold uppercase text-slate-400">
                    Xe / HDV
                  </th>
                  <th className="p-4 text-center text-[11px] font-extrabold uppercase text-slate-400">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departures.map((row) => {
                  const rowKey = String(row.scheduleId);
                  const isOpen = expandedId === rowKey;
                  const hasBookings = row.bookingCount > 0;

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        className={
                          hasBookings
                            ? "bg-white hover:bg-blue-50/40"
                            : "bg-slate-50/50 text-slate-500"
                        }
                      >
                        <td className="p-4">
                          <p className="font-bold text-slate-900">
                            {row.tourTitle}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} className="text-blue-500" />
                              {row.tourCity}
                            </span>
                            <span>{row.tourDuration} ngày</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-blue-700">
                            {formatDepartureDateTime(row.departureAt)}
                          </p>
                          {hasBookings && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {row.confirmedBookings > 0 && (
                                <StatusPill status="confirmed" />
                              )}
                              {row.pendingBookings > 0 && (
                                <StatusPill status="pending" />
                              )}
                              {row.cancelPendingBookings > 0 && (
                                <StatusPill status="cancel_pending" />
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-lg font-extrabold ${hasBookings ? "text-slate-900" : "text-slate-400"}`}
                          >
                            {row.bookingCount}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-lg font-extrabold ${hasBookings ? "text-emerald-600" : "text-slate-400"}`}
                          >
                            {row.passengerCount}
                          </span>
                          {row.maxGroupSize > 0 && (
                            <p className="mt-1 text-[10px] font-bold text-slate-400">
                              {row.fillRate}% ghế
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center text-sm">
                          <span className="font-bold text-slate-800">
                            {row.passengerCount}
                          </span>
                          <span className="text-slate-400">
                            {" "}
                            / {row.maxGroupSize || "—"}
                          </span>
                          {row.remainingSeats > 0 && hasBookings && (
                            <p className="mt-1 text-[10px] text-emerald-600">
                              Còn {row.remainingSeats} chỗ
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {hasBookings ? (
                            <div className="inline-flex flex-col gap-1 text-sm font-bold">
                              <span className="text-amber-700">
                                {row.suggestedVehicles} xe
                              </span>
                              <span className="text-violet-700">
                                {row.suggestedGuides} HDV
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {hasBookings ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isOpen ? null : rowKey)
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                            >
                              {isOpen ? (
                                <>
                                  Thu gọn <ChevronUp size={14} />
                                </>
                              ) : (
                                <>
                                  Xem đơn <ChevronDown size={14} />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Chưa có đơn
                            </span>
                          )}
                        </td>
                      </tr>
                      {isOpen && hasBookings && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/80 p-4">
                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full min-w-[640px] text-left text-sm">
                                <thead className="border-b border-slate-100 bg-slate-50">
                                  <tr>
                                    <th className="p-3 text-[10px] font-extrabold uppercase text-slate-400">
                                      Khách hàng
                                    </th>
                                    <th className="p-3 text-[10px] font-extrabold uppercase text-slate-400">
                                      Liên hệ
                                    </th>
                                    <th className="p-3 text-center text-[10px] font-extrabold uppercase text-slate-400">
                                      Số khách
                                    </th>
                                    <th className="p-3 text-center text-[10px] font-extrabold uppercase text-slate-400">
                                      Trạng thái
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {row.bookings.map((b) => (
                                    <tr key={b._id} className="hover:bg-blue-50/30">
                                      <td className="p-3 font-semibold text-slate-800">
                                        {b.name}
                                      </td>
                                      <td className="p-3 text-slate-600">
                                        <div>{b.email}</div>
                                        <div className="mt-0.5 inline-flex items-center gap-1 text-xs">
                                          <Phone size={11} />
                                          {b.phone}
                                        </div>
                                      </td>
                                      <td className="p-3 text-center font-bold text-slate-800">
                                        {b.travelers}
                                        <span className="block text-[10px] font-normal text-slate-400">
                                          {b.guestSize?.adult ?? 0} NL
                                          {(b.guestSize?.children ?? 0) > 0 &&
                                            ` · ${b.guestSize.children} TE`}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <StatusPill status={b.status} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Gợi ý xe/HDV tính theo ~{16} khách/xe và ~25 khách/HDV — có thể điều chỉnh
        thực tế tùy loại xe và quy mô đoàn.
      </p>
    </div>
  );
};

export default TourDispatch;
