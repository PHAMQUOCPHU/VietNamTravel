import React, { useContext, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  Eye,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  SearchX,
  Tag,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  tourCategoryDisplayLabel,
  normalizeTourCategory,
} from "../constants/tourCategories.js";
import { buildTourSlug } from "../lib/tourSlug";

const EMPTY_SEARCH_FILTERS = {};

const SearchResultList = () => {
  const { tours } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const searchData = useMemo(
    () => location.state ?? EMPTY_SEARCH_FILTERS,
    [location.state],
  );
  const [filteredSchedules, setFilteredSchedules] = useState([]);

  useEffect(() => {
    if (!tours || !searchData) return;

    const dayStamp = (isoDay) => {
      const d = new Date(isoDay);
      if (Number.isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const slotDayStamp = (dateStr) => {
      const dayKey = String(dateStr).split("|")[0];
      return dayStamp(dayKey);
    };

    const results = [];

    tours.forEach((tour) => {
      const prov = String(searchData.province ?? "").trim();
      const matchCity =
        !prov ||
        prov === "Tất cả tỉnh thành" ||
        prov === "Tất cả" ||
        String(tour.city ?? "").trim() === prov ||
        String(tour.city ?? "").trim().toLowerCase() === prov.toLowerCase();

      const rawReg = searchData.region;
      let wantRegion = String(rawReg ?? "").trim();
      if (wantRegion.startsWith("Miền ")) {
        wantRegion = wantRegion.replace("Miền ", "").trim();
      }
      const matchRegion =
        !wantRegion ||
        wantRegion === "Tất cả điểm đến" ||
        wantRegion === "Tất cả" ||
        tour.region === wantRegion;

      const pref = String(searchData.preference ?? "").trim();
      const matchCategory =
        !pref ||
        pref === "Tất cả loại hình" ||
        pref === "Tất cả" ||
        normalizeTourCategory(tour.category) === normalizeTourCategory(pref);

      if (!matchCity || !matchRegion || !matchCategory) return;

      const slots = Array.isArray(tour.availableDates) ? tour.availableDates : [];
      const hasDateFilter = Boolean(searchData.startDate || searchData.endDate);

      const startT = searchData.startDate ? dayStamp(searchData.startDate) : null;
      const endT = searchData.endDate ? dayStamp(searchData.endDate) : null;

      let matchedSlots = slots;
      if (hasDateFilter) {
        matchedSlots = slots.filter((slot) => {
          const t = slotDayStamp(slot);
          if (t == null) return false;
          if (startT != null && endT != null) {
            const lo = Math.min(startT, endT);
            const hi = Math.max(startT, endT);
            return t >= lo && t <= hi;
          }
          if (startT != null && endT == null) return t >= startT;
          if (startT == null && endT != null) return t <= endT;
          return true;
        });
      }

      if (hasDateFilter && matchedSlots.length === 0) return;

      if (matchedSlots.length > 0) {
        matchedSlots.forEach((slot) => {
          results.push({ tour, slot });
        });
      } else {
        results.push({ tour, slot: null });
      }
    });

    setFilteredSchedules(results);
    window.scrollTo(0, 0);
  }, [tours, searchData]);

  const getImageUrl = (image) => {
    if (
      typeof image === "string" &&
      !image.includes("data:image") &&
      !image.startsWith("http")
    ) {
      return "https://via.placeholder.com/150?text=No+Image";
    }
    return image;
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Đang cập nhật";
    const datePart = String(isoString).split("|")[0];
    const d = new Date(datePart);
    if (isNaN(d)) return "Đang cập nhật";
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const calculateEndDate = (isoString, duration) => {
    if (!isoString) return "Đang cập nhật";
    const datePart = String(isoString).split("|")[0];
    const d = new Date(datePart);
    if (isNaN(d)) return "Đang cập nhật";
    d.setDate(d.getDate() + (Number(duration) - 1 || 0));
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-r from-[#0f3fa8] via-[#1d4ed8] to-[#2563eb] p-6 md:p-7 shadow-xl mb-8"
        >
          <div className="flex items-center gap-2 text-white/95 mb-2">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-widest">
              Lịch trình khả dụng
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            Kết quả tìm kiếm
          </h1>
          <p className="text-blue-100 text-sm mt-2 font-medium">
            Đang hiển thị {filteredSchedules.length} lịch trình phù hợp cho{" "}
            <span className="font-black text-white">
              {(Number(searchData.adults) || 0) + (Number(searchData.children) || 0)}{" "}
              khách
            </span>
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors font-black text-xs uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Quay lại tìm kiếm
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-2">
              <Users size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-slate-600">
                Khách:{" "}
                {(Number(searchData.adults) || 0) +
                  (Number(searchData.children) || 0)}
              </span>
            </div>
            {searchData.startDate && (
              <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-2">
                <Calendar size={14} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase text-slate-600">
                  Từ ngày:{" "}
                  {new Date(searchData.startDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
            )}
          </div>
        </div>

        {filteredSchedules.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(37,99,235,0.10)] border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-[11px] font-black uppercase text-slate-500 tracking-widest">Tour</th>
                    <th className="p-4 text-[11px] font-black uppercase text-slate-500 tracking-widest w-32">Số chỗ</th>
                    <th className="p-4 text-[11px] font-black uppercase text-slate-500 tracking-widest w-40">Thời gian</th>

                    <th className="p-4 text-[11px] font-black uppercase text-slate-500 tracking-widest w-40 text-center">Giá tour</th>
                    <th className="p-4 text-[11px] font-black uppercase text-slate-500 tracking-widest w-40 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedules.map((schedule, idx) => {
                    const { tour, slot } = schedule;
                    const maxGs = Number(tour.maxGroupSize) || 0;
                    const joined = Number(tour.joinedParticipants) || 0;
                    const remainingSlots = Math.max(0, maxGs - joined);
                    const isFull = remainingSlots === 0;

                    return (
                      <motion.tr
                        key={`${tour._id}-${slot || idx}`}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={getImageUrl(tour.images?.[0] || tour.image)}
                                alt={tour.title}
                                className="w-20 h-20 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                            <div className="flex flex-col justify-center max-w-[320px]">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MapPin size={10} /> {tour.city}
                              </span>
                              <p className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                {tour.title}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {tour.featured && (
                                  <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Nổi bật</span>
                                )}
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                  {tourCategoryDisplayLabel(tour.category)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top pt-6">
                          <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 flex justify-center text-emerald-500"><Users size={14}/></span>
                              <span>Số chỗ: <span className="text-slate-800">{maxGs}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 flex justify-center text-blue-500"><Users size={14}/></span>
                              <span>Đã bán: <span className="text-slate-800">{joined}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 flex justify-center text-orange-500"><Users size={14}/></span>
                              <span>Còn: <span className={remainingSlots <= 5 ? "text-red-500" : "text-emerald-600"}>{remainingSlots}</span></span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top pt-6">
                          <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 flex justify-center text-emerald-500"><Calendar size={14}/></span>
                              <span>Đi: <span className="text-slate-800">{formatDate(slot)}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 flex justify-center text-red-500"><Calendar size={14}/></span>
                              <span>Về: <span className="text-slate-800">{calculateEndDate(slot, tour.duration)}</span></span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-top pt-6 text-center">
                          <div className="flex flex-col items-center justify-center h-full">
                            {tour.isSaleActive ? (
                              <>
                                <span className="text-red-500 font-black text-lg tracking-tight">
                                  {Number(tour.salePrice || tour.price)?.toLocaleString()}đ
                                </span>
                                <span className="text-slate-400 text-[10px] line-through font-bold decoration-red-400/30">
                                  {Number(tour.originalPrice || tour.price)?.toLocaleString()}đ
                                </span>
                              </>
                            ) : (
                              <span className="text-blue-600 font-black text-lg tracking-tight">
                                {Number(tour.price)?.toLocaleString()}đ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-top pt-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {isFull ? (
                              <span className="text-red-500 font-black text-xs uppercase bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                Đã hết chỗ
                              </span>
                            ) : (
                              <span className="text-orange-500 font-black text-xs uppercase bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 whitespace-nowrap">
                                Còn nhận {remainingSlots} chỗ
                              </span>
                            )}
                            <button
                              onClick={() => navigate(`/tours/${buildTourSlug(tour)}`)}
                              className="bg-white border-2 border-orange-400 text-orange-500 hover:bg-orange-50 w-full py-2 rounded-xl text-xs font-black uppercase transition-colors"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchX size={48} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
              Không tìm thấy lịch trình phù hợp
            </h3>
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 w-fit mx-auto px-4 py-2 rounded-xl mb-8 border border-amber-100">
              <AlertCircle size={16} />
              <p className="text-xs font-bold uppercase">
                Gợi ý: Thử chọn "Tất cả" hoặc thay đổi khoảng thời gian
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-[#1e3a8a] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            >
              Quay lại tìm kiếm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultList;
