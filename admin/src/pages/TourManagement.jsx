import React, { useEffect, useState, useContext, useCallback } from "react";
import { AdminContext } from "../context/AdminContext";
import { listToursApi, removeTourApi, toggleTourStatusApi } from "../api/tourApi";
import { toast } from "react-toastify";
import {
  Trash2,
  MapPin,
  Pencil,
  Search,
  Loader2,
  AlertCircle,
  EyeOff,
  Eye,
  CircleDollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buildTourSlug } from "../utils/tourSlug";

const priceFilters = [
  { id: "all", label: "Tat ca muc gia" },
  { id: "lt500", label: "Duoi 500k" },
  { id: "gt1000", label: "Tren 1tr" },
  { id: "gt2000", label: "Tren 2tr" },
];

const TourManagement = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const normalizeImageUrl = (imageValue) => {
    if (!imageValue) return "https://placehold.co/600x400?text=No+Image";
    return String(imageValue).startsWith("http")
      ? imageValue
      : "https://placehold.co/600x400?text=No+Image";
  };
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State Tìm kiếm & Phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const toursPerPage = 8;

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listToursApi(aToken, backendUrl, true);
      if (response.success) {
        setTours(response.tours);
      } else {
        toast.error(response.message || "Lỗi lấy danh sách!");
      }
    } catch (err) {
      console.error("API Error:", err);
      toast.error("Kết nối server thất bại!");
    } finally {
      setLoading(false);
    }
  }, [aToken, backendUrl]);

  useEffect(() => {
    if (aToken) fetchTours();
  }, [aToken, fetchTours]);

  const removeTour = async (id) => {
    if (window.confirm("Xác nhận xóa tour này?")) {
      try {
        const response = await removeTourApi(id, aToken, backendUrl);
        if (response.success) {
          toast.success("Đã xóa tour!");
          fetchTours();
        }
      } catch {
        toast.error("Lỗi khi xóa!");
      }
    }
  };

  const toggleTourStatus = async (tour) => {
    try {
      const response = await toggleTourStatusApi(
        tour._id,
        !tour.isActive,
        aToken,
        backendUrl,
      );
      if (response.success) {
        toast.success(response.message);
        fetchTours();
      } else {
        toast.error(response.message || "Khong cap nhat duoc trang thai");
      }
    } catch {
      toast.error("Loi cap nhat trang thai tour");
    }
  };

  const matchPriceFilter = (price) => {
    if (priceFilter === "lt500") return price < 500000;
    if (priceFilter === "gt1000") return price >= 1000000;
    if (priceFilter === "gt2000") return price >= 2000000;
    return true;
  };

  const filteredTours = tours.filter(
    (t) =>
      (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.city.toLowerCase().includes(searchTerm.toLowerCase())) &&
      matchPriceFilter(Number(t.price) || 0),
  );

  const indexOfLastTour = currentPage * toursPerPage;
  const currentTours = filteredTours.slice(
    indexOfLastTour - toursPerPage,
    indexOfLastTour,
  );
  const totalPages = Math.ceil(filteredTours.length / toursPerPage);

  return (
    <div className="m-5 w-full max-w-7xl animate-in fade-in duration-500 space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#60a5fa] p-5 md:p-6 text-white shadow-md">
        <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight">
          Quản lý Tour{" "}
          <span className="text-blue-100">({filteredTours.length})</span>
        </h2>
        <p className="text-blue-100/95 mt-1 text-sm">
          Theo dõi trạng thái hoạt động và tối ưu danh mục tour theo giá bán.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm tên tour hoặc thành phố..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-all bg-white shadow-sm text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {priceFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setPriceFilter(filter.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                priceFilter === filter.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-400 font-medium">
              Đang tải dữ liệu từ server...
            </p>
          </div>
        ) : tours.length === 0 ? (
          <div className="py-20 text-center">
            <AlertCircle className="mx-auto text-slate-200 mb-4" size={60} />
            <p className="text-slate-400 italic">
              Hệ thống chưa có tour nào. Bạn hãy thêm tour mới nhé!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-[11px] font-extrabold uppercase text-slate-400">
                    Ảnh
                  </th>
                  <th className="p-4 text-[11px] font-extrabold uppercase text-slate-400">
                    Thông tin Tour
                  </th>
                  <th className="p-4 text-[11px] font-extrabold uppercase text-slate-400 text-center">
                    Giá vé
                  </th>
                  <th className="p-4 text-[11px] font-extrabold uppercase text-slate-400 text-center">
                    Trang thai
                  </th>
                  <th className="p-4 text-[11px] font-extrabold uppercase text-slate-400 text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentTours.map((item) => (
                  <tr
                    key={item._id}
                    className={`transition-all group ${
                      item.isActive === false
                        ? "bg-rose-50/70 hover:bg-rose-100/70"
                        : "hover:bg-blue-50/30"
                    }`}
                  >
                    <td className="p-4">
                      <div className="relative">
                        <img
                          src={normalizeImageUrl(item.images?.[0] || item.image)}
                          className="w-20 h-14 object-cover rounded-lg shadow-sm group-hover:scale-105 transition-transform"
                          alt=""
                          onError={(e) => (e.target.src = normalizeImageUrl(""))}
                        />
                        {item.isActive === false && (
                          <span className="absolute inset-0 rounded-lg bg-slate-900/60 text-white text-[9px] font-black flex items-center justify-center">
                            NGUNG KD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-base">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                        <MapPin size={12} className="text-blue-500" />{" "}
                        {item.city}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <p className="font-extrabold text-blue-600 inline-flex items-center gap-1">
                        <CircleDollarSign size={13} />
                        {item.price?.toLocaleString()}đ
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.isActive === false
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.isActive === false
                          ? "Ngung kinh doanh"
                          : "Dang hoat dong"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/edit-tour/${buildTourSlug(item)}`)
                          }
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => removeTour(item._id)}
                          className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleTourStatus(item)}
                          className={`p-2.5 rounded-lg transition-all shadow-sm ${
                            item.isActive === false
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white"
                          }`}
                          title={
                            item.isActive === false
                              ? "Mo lai kinh doanh"
                              : "Chuyen sang ngung kinh doanh"
                          }
                        >
                          {item.isActive === false ? (
                            <Eye size={16} />
                          ) : (
                            <EyeOff size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-12 h-12 rounded-xl font-bold transition-all ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-slate-400 hover:bg-slate-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TourManagement;
