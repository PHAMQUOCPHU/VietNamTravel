import { useContext, useEffect, useMemo, useState } from "react";
import { AdminContext } from "../context/AdminContext";
import { listToursApi, listOnSaleToursApi, updateSaleToursApi } from "../api/tourApi";
import {
  Percent,
  CalendarDays,
  Tags,
  Pencil,
  Trash2,
  Sparkles,
  Clock3,
} from "lucide-react";
import { toast } from "react-toastify";

const PromotionManager = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [applyMode, setApplyMode] = useState("all");
  const [allTours, setAllTours] = useState([]);
  const [onSaleTours, setOnSaleTours] = useState([]);
  const [selectedTourIds, setSelectedTourIds] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [saleStartDate, setSaleStartDate] = useState("");
  const [saleEndDate, setSaleEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTourId, setEditingTourId] = useState("");
  const statusConfig = {
    pending: {
      label: "Đang chờ sale",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    active: {
      label: "Đang sale",
      className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    expired: {
      label: "Đã hết hạn",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

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


  const fetchData = async () => {
    try {
      const [allRes, saleRes] = await Promise.all([
        listToursApi(aToken, backendUrl, true),
        listOnSaleToursApi(aToken, backendUrl),
      ]);
      if (allRes.success) setAllTours(allRes.tours || []);
      if (saleRes.success) setOnSaleTours(saleRes.tours || []);
    } catch (error) {
      toast.error("Không tải được dữ liệu khuyến mãi");
    }
  };

  useEffect(() => {
    if (aToken) fetchData();
  }, [aToken]);

  const selectedCountText = useMemo(() => {
    if (applyMode === "all") return `${allTours.length} tour`;
    return `${selectedTourIds.length} tour đã chọn`;
  }, [applyMode, allTours.length, selectedTourIds.length]);

  const toggleSelectTour = (id) => {
    setSelectedTourIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleApplySale = async (isEnableSale) => {
    if (isEnableSale) {
      if (!saleStartDate || !saleEndDate) {
        return toast.error("Vui lòng chọn ngày giờ bắt đầu và kết thúc");
      }
      if (new Date(saleStartDate).getTime() > new Date(saleEndDate).getTime()) {
        return toast.error("Thời gian bắt đầu không được sau thời gian kết thúc");
      }
    }

    try {
      setLoading(true);
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
    } catch (error) {
      toast.error("Lỗi cập nhật khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = (tour) => {
    setApplyMode("selected");
    setSelectedTourIds([tour._id]);
    setDiscountPercent(tour.discountPercent || 0);
    setSaleStartDate(toDateTimeLocalValue(tour.saleStartDate));
    setSaleEndDate(toDateTimeLocalValue(tour.saleEndDate));
    setEditingTourId(tour._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemoveSale = async (tourId) => {
    try {
      setLoading(true);
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
    } catch (error) {
      toast.error("Lỗi xóa sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-5 w-full max-w-7xl space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#38bdf8] p-6 text-white shadow-md">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">
          Quản lý khuyến mãi (Sale Off)
        </h2>
        <p className="text-blue-100 mt-1 text-sm">
          Cấu hình giảm giá theo thời gian cho toàn bộ hoặc từng tour.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Tất cả tour" },
            { id: "selected", label: "Chọn từng tour" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setApplyMode(mode.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                applyMode === mode.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {mode.label}
            </button>
          ))}
          <span className="ml-auto text-sm font-semibold text-slate-600">
            {selectedCountText}
          </span>
        </div>
        <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-xs text-blue-700 font-semibold flex items-center gap-2">
          <Sparkles size={14} />
          Tour có thể ở trạng thái chờ sale, đang sale hoặc hết hạn tùy theo ngày giờ.
        </div>

        {applyMode === "selected" && (
          <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-100 p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {allTours.map((tour) => (
                <label
                  key={tour._id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedTourIds.includes(tour._id)}
                    onChange={() => toggleSelectTour(tour._id)}
                  />
                  <span className="truncate">{tour.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="rounded-2xl border border-slate-100 px-3 py-2">
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Percent size={14} /> % giảm giá
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full mt-1 text-sm font-bold outline-none"
            />
          </label>
          <label className="rounded-2xl border border-slate-100 px-3 py-2">
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <CalendarDays size={14} /> Bắt đầu sale
            </span>
            <input
              type="datetime-local"
              value={saleStartDate}
              onChange={(e) => setSaleStartDate(e.target.value)}
              className="w-full mt-1 text-sm font-semibold outline-none"
            />
          </label>
          <label className="rounded-2xl border border-slate-100 px-3 py-2">
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <CalendarDays size={14} /> Kết thúc sale
            </span>
            <input
              type="datetime-local"
              value={saleEndDate}
              onChange={(e) => setSaleEndDate(e.target.value)}
              className="w-full mt-1 text-sm font-semibold outline-none"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleApplySale(true)}
            disabled={loading || (applyMode === "selected" && !selectedTourIds.length)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            Áp dụng sale
          </button>
          <button
            onClick={() => handleApplySale(false)}
            disabled={loading || (applyMode === "selected" && !selectedTourIds.length)}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            Tắt sale
          </button>
          {editingTourId && (
            <button
              onClick={() => {
                setEditingTourId("");
                setSelectedTourIds([]);
                setSaleStartDate("");
                setSaleEndDate("");
                setDiscountPercent(10);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Tags size={18} className="text-blue-600" />
          <h3 className="font-extrabold text-slate-800">Danh sách tour cấu hình sale</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px]">
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
              {onSaleTours.map((tour) => (
                <tr key={tour._id} className="hover:bg-blue-50/20">
                  <td className="px-4 py-3 font-semibold text-slate-800">{tour.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateTimeDisplay(tour.saleStartDate)} -{" "}
                    {formatDateTimeDisplay(tour.saleEndDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${
                        statusConfig[tour.saleStatus || "pending"]?.className
                      }`}
                    >
                      <Clock3 size={12} />
                      {statusConfig[tour.saleStatus || "pending"]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-md bg-red-100 text-red-600 font-bold">
                      {tour.discountPercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-xs text-slate-400 line-through">
                        {Number(tour.originalPrice).toLocaleString()}đ
                      </span>
                      <span className="text-base font-extrabold text-red-500">
                        {Number(tour.salePrice).toLocaleString()}đ
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => handleEditSale(tour)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        title="Chỉnh sửa sale"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveSale(tour._id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        title="Xóa sale"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!onSaleTours.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Hiện chưa có tour nào được cấu hình khuyến mãi.
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
