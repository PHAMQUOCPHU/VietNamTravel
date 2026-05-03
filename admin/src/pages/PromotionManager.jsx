import { useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { AdminContext } from "../context/AdminContext";
import {
  listToursApi,
  listOnSaleToursApi,
  updateSaleToursApi,
} from "../api/tourApi";
import {
  Percent,
  CalendarDays,
  Tags,
  Pencil,
  Trash2,
  Sparkles,
  Clock3,
  Loader2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

const statusConfig = {
  pending: {
    label: "Đang chờ sale",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  active: {
    label: "Đang sale",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  expired: {
    label: "Đã hết hạn",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  none: {
    label: "Chưa trong khung giờ",
    className: "bg-violet-50 text-violet-800 border-violet-200",
  },
};

const PromotionManager = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [applyMode, setApplyMode] = useState("all");
  const [allTours, setAllTours] = useState([]);
  const [onSaleTours, setOnSaleTours] = useState([]);
  const [selectedTourIds, setSelectedTourIds] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [saleStartDate, setSaleStartDate] = useState("");
  const [saleEndDate, setSaleEndDate] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTourId, setEditingTourId] = useState("");
  const [tourSearch, setTourSearch] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateTimeDisplay = (value) => {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--";
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchData = useCallback(async () => {
    if (!aToken) return;
    setPageLoading(true);
    try {
      const [allRes, saleRes] = await Promise.all([
        listToursApi(aToken, backendUrl, true),
        listOnSaleToursApi(aToken, backendUrl),
      ]);
      if (!mounted.current) return;
      if (allRes.success) setAllTours(allRes.tours || []);
      else toast.error(allRes.message || "Không tải danh sách tour");
      if (saleRes.success) setOnSaleTours(saleRes.tours || []);
      else toast.error(saleRes.message || "Không tải tour đang sale");
    } catch {
      if (mounted.current) toast.error("Không tải được dữ liệu khuyến mãi");
    } finally {
      if (mounted.current) setPageLoading(false);
    }
  }, [aToken, backendUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedCountText = useMemo(() => {
    if (applyMode === "all") return `${allTours.length} tour`;
    return `${selectedTourIds.length} tour đã chọn`;
  }, [applyMode, allTours.length, selectedTourIds.length]);

  const filteredToursForPicker = useMemo(() => {
    const q = tourSearch.trim().toLowerCase();
    if (!q) return allTours;
    return allTours.filter((t) =>
      (t.title || "").toLowerCase().includes(q),
    );
  }, [allTours, tourSearch]);

  const toggleSelectTour = (id) => {
    setSelectedTourIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleApplySale = async (isEnableSale) => {
    if (isEnableSale) {
      if (!saleStartDate || !saleEndDate) {
        toast.error("Vui lòng chọn ngày giờ bắt đầu và kết thúc");
        return;
      }
      if (new Date(saleStartDate).getTime() > new Date(saleEndDate).getTime()) {
        toast.error("Thời gian bắt đầu không được sau thời gian kết thúc");
        return;
      }
      const pct = Number(discountPercent);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        toast.error("% giảm giá phải từ 0 đến 100");
        return;
      }
      if (pct === 0) {
        toast.error("Nhập % giảm lớn hơn 0 hoặc dùng nút «Tắt sale»");
        return;
      }
    }

    if (applyMode === "selected" && !selectedTourIds.length) {
      toast.error("Vui lòng chọn ít nhất một tour");
      return;
    }

    if (applyMode === "all" && !allTours.length) {
      toast.error("Chưa có tour trong hệ thống");
      return;
    }

    if (applyMode === "all" && isEnableSale) {
      if (
        !window.confirm(
          `Áp dụng sale cho TẤT CẢ ${allTours.length} tour với ${Number(discountPercent)}%?`,
        )
      )
        return;
    }
    if (applyMode === "all" && !isEnableSale) {
      if (
        !window.confirm(
          "Tắt sale cho toàn bộ tour (đặt isSale = false, xóa khung thời gian)?",
        )
      )
        return;
    }

    try {
      setSaving(true);
      const payload = {
        applyToAll: applyMode === "all",
        tourIds: applyMode === "selected" ? selectedTourIds : [],
        isSale: isEnableSale,
        discountPercent: Number(discountPercent) || 0,
        saleStartDate,
        saleEndDate,
      };
      const res = await updateSaleToursApi(payload, aToken, backendUrl);
      if (!res.success) return toast.error(res.message || "Cập nhật thất bại");
      toast.success(res.message || "Đã cập nhật khuyến mãi");
      await fetchData();
      if (applyMode === "selected" && !editingTourId) setSelectedTourIds([]);
      setEditingTourId("");
    } catch {
      toast.error("Lỗi cập nhật khuyến mãi");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSale = (tour) => {
    setApplyMode("selected");
    setSelectedTourIds([tour._id]);
    setDiscountPercent(Number(tour.discountPercent) || 0);
    setSaleStartDate(toDateTimeLocalValue(tour.saleStartDate));
    setSaleEndDate(toDateTimeLocalValue(tour.saleEndDate));
    setEditingTourId(tour._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Đã tải cấu hình sale lên form — chỉnh sửa rồi bấm «Áp dụng sale».");
  };

  const handleRemoveSale = async (tourId, title) => {
    if (
      !window.confirm(
        `Gỡ sale cho tour «${(title || "").slice(0, 80)}${(title || "").length > 80 ? "…" : ""}»?`,
      )
    )
      return;
    try {
      setSaving(true);
      const res = await updateSaleToursApi(
        {
          applyToAll: false,
          tourIds: [tourId],
          isSale: false,
          discountPercent: 0,
        },
        aToken,
        backendUrl,
      );
      if (!res.success) return toast.error(res.message || "Không xóa được sale");
      toast.success("Đã xóa sale cho tour");
      await fetchData();
      if (editingTourId === tourId) {
        setEditingTourId("");
        setSelectedTourIds([]);
      }
    } catch {
      toast.error("Lỗi xóa sale");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status) => {
    const cfg = statusConfig[status] || statusConfig.none;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.className}`}
      >
        <Clock3 size={12} aria-hidden />
        {cfg.label}
      </span>
    );
  };

  const disableApply =
    saving ||
    pageLoading ||
    (applyMode === "selected" && !selectedTourIds.length) ||
    !allTours.length;

  const disableTurnOff =
    saving ||
    pageLoading ||
    (applyMode === "selected" && !selectedTourIds.length);

  return (
    <div className="w-full max-w-7xl space-y-6 px-1 sm:px-0">
      <div className="rounded-3xl bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-sky-500 p-6 sm:p-8 text-white shadow-lg shadow-blue-900/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight sm:text-2xl">
              Quản lý khuyến mãi (Sale off)
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-blue-100/95 leading-relaxed">
              Cấu hình giảm giá theo thời gian cho toàn bộ hoặc từng tour. Trạng
              thái cột bảng cập nhật theo ngày giờ hiện tại.
            </p>
          </div>
          {editingTourId ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-bold">
              Đang sửa 1 tour
            </span>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "Tất cả tour" },
            { id: "selected", label: "Chọn từng tour" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={pageLoading || saving}
              onClick={() => {
                setApplyMode(mode.id);
                setTourSearch("");
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                applyMode === mode.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              } disabled:opacity-50`}
            >
              {mode.label}
            </button>
          ))}
          <span className="ml-auto text-sm font-semibold text-slate-600">
            {selectedCountText}
          </span>
        </div>

        <div className="flex gap-2 rounded-2xl border border-amber-100 bg-amber-50/90 px-4 py-3 text-xs font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            «Áp dụng sale» với chế độ <strong>Tất cả tour</strong> sẽ ghi đè
            cùng một mức % và khung giờ cho mọi tour. Hành động lớn — đã thêm
            xác nhận trước khi gửi.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-xs font-semibold text-blue-900">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <p>
            Tour có thể ở trạng thái <strong>chờ sale</strong>,{" "}
            <strong>đang sale</strong> hoặc <strong>hết hạn</strong> tùy ngày
            giờ so với máy chủ.
          </p>
        </div>

        {applyMode === "selected" && (
          <div className="space-y-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={tourSearch}
                onChange={(e) => setTourSearch(e.target.value)}
                placeholder="Lọc tour theo tên…"
                className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-blue-500/0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
              <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                {filteredToursForPicker.map((tour) => (
                  <label
                    key={tour._id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTourIds.includes(tour._id)}
                      onChange={() => toggleSelectTour(tour._id)}
                    />
                    <span className="min-w-0 truncate font-medium text-slate-800">
                      {tour.title}
                    </span>
                  </label>
                ))}
              </div>
              {!filteredToursForPicker.length && (
                <p className="py-6 text-center text-xs text-slate-500">
                  Không có tour khớp tìm kiếm.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Percent size={14} /> % giảm giá
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="mt-2 w-full border-0 bg-transparent text-lg font-black text-slate-900 outline-none"
            />
          </label>
          <label className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <CalendarDays size={14} /> Bắt đầu sale
            </span>
            <input
              type="datetime-local"
              value={saleStartDate}
              onChange={(e) => setSaleStartDate(e.target.value)}
              className="mt-2 w-full border-0 bg-transparent text-sm font-semibold text-slate-800 outline-none"
            />
          </label>
          <label className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <CalendarDays size={14} /> Kết thúc sale
            </span>
            <input
              type="datetime-local"
              value={saleEndDate}
              onChange={(e) => setSaleEndDate(e.target.value)}
              className="mt-2 w-full border-0 bg-transparent text-sm font-semibold text-slate-800 outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleApplySale(true)}
            disabled={disableApply}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Áp dụng sale
          </button>
          <button
            type="button"
            onClick={() => handleApplySale(false)}
            disabled={disableTurnOff}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Tắt sale
          </button>
          {editingTourId ? (
            <button
              type="button"
              onClick={() => {
                setEditingTourId("");
                setSelectedTourIds([]);
                setSaleStartDate("");
                setSaleEndDate("");
                setDiscountPercent(10);
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy chỉnh sửa
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <Tags size={18} className="text-blue-600" />
          <h3 className="font-black text-slate-800">
            Danh sách tour cấu hình sale
          </h3>
          {pageLoading ? (
            <Loader2 className="ml-auto h-4 w-4 animate-spin text-slate-400" />
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Tour</th>
                <th className="px-4 py-3 text-left">Thời gian sale</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">% giảm</th>
                <th className="px-4 py-3 text-center">Giá vé</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : (
                onSaleTours.map((tour) => (
                  <tr key={tour._id} className="hover:bg-blue-50/30">
                    <td className="max-w-[220px] px-4 py-3 font-semibold text-slate-800">
                      <span className="line-clamp-2">{tour.title}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateTimeDisplay(tour.saleStartDate)} —{" "}
                      {formatDateTimeDisplay(tour.saleEndDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusBadge(tour.saleStatus || "none")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-lg bg-red-50 px-2 py-1 text-sm font-black text-red-600">
                        {tour.discountPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-xs text-slate-400 line-through">
                          {Number(tour.originalPrice).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="text-base font-extrabold text-red-600">
                          {Number(tour.salePrice).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditSale(tour)}
                          disabled={saving}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                          title="Chỉnh sửa sale"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSale(tour._id, tour.title)}
                          disabled={saving}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          title="Xóa sale"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!pageLoading && !onSaleTours.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-sm text-slate-500"
                  >
                    Hiện chưa có tour nào bật <strong>isSale</strong> với % &gt;
                    0. Hãy cấu hình phía trên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionManager;
