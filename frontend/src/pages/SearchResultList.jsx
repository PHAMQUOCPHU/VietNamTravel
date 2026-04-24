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
  const [filteredTours, setFilteredTours] = useState([]);

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

    const results = tours.filter((tour) => {
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
        pref === "Tất cả" ||
        normalizeTourCategory(tour.category) === normalizeTourCategory(pref);

      const totalGuestsRequested =
        (Number(searchData.adults) || 0) + (Number(searchData.children) || 0);
      const maxGs = Number(tour.maxGroupSize) || 0;
      const joined = Number(tour.joinedParticipants) || 0;
      const remainingSlots = Math.max(0, maxGs - joined);
      const hasEnoughSpace = remainingSlots >= totalGuestsRequested;

      const slots = Array.isArray(tour.availableDates) ? tour.availableDates : [];
      const hasDateFilter = Boolean(searchData.startDate || searchData.endDate);

      let matchTime = true;
      if (hasDateFilter) {
        if (!slots.length) {
          matchTime = false;
        } else {
          const startT = searchData.startDate
            ? dayStamp(searchData.startDate)
            : null;
          const endT = searchData.endDate ? dayStamp(searchData.endDate) : null;

          matchTime = slots.some((slot) => {
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
      }

      return (
        matchCity &&
        matchRegion &&
        matchCategory &&
        hasEnoughSpace &&
        matchTime
      );
    });

    setFilteredTours(results);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/40 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-r from-[#0f3fa8] via-[#1d4ed8] to-[#2563eb] p-6 md:p-7 shadow-xl mb-8"
        >
          <div className="flex items-center gap-2 text-white/95 mb-2">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-widest">
              Kết quả thông minh
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            Kết quả tìm kiếm
          </h1>
          <p className="text-blue-100 text-sm mt-2 font-medium">
            Đang hiển thị các tour phù hợp cho{" "}
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

        {filteredTours.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(37,99,235,0.10)] border border-slate-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Tour & Địa điểm
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Thể loại
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Thời gian
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Tình trạng chỗ
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                      Giá vé
                    </th>
                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTours.map((tour) => {
                    const remainingSlots =
                      tour.maxGroupSize - (tour.joinedParticipants || 0);
                    return (
                      <motion.tr
                        key={tour._id}
                        className="group hover:bg-blue-50/40 transition-all cursor-default"
                        whileHover={{ scale: 1.003 }}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={getImageUrl(tour.images?.[0] || tour.image)}
                                alt={tour.title}
                                className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                              {tour.featured && (
                                <div className="absolute -top-2 -left-2 bg-orange-500 text-white p-1.5 rounded-lg shadow-lg">
                                  <Tag size={12} fill="white" />
                                </div>
                              )}
                            </div>
                            <div className="max-w-[280px]">
                              <p className="font-black text-slate-800 text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {tour.title}
                              </p>
                              <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">
                                <MapPin size={12} className="text-blue-500" />{" "}
                                {tour.city} ({tour.region})
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-slate-200">
                            {tourCategoryDisplayLabel(tour.category)}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-black text-slate-900 text-sm">
                              {tour.duration || 1} Ngày
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              Trọn gói
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 mb-1">
                              <Users
                                size={14}
                                className={
                                  remainingSlots <= 5
                                    ? "text-red-500"
                                    : "text-emerald-500"
                                }
                              />
                              <span
                                className={`text-sm font-black ${remainingSlots <= 5 ? "text-red-500" : "text-emerald-600"}`}
                              >
                                Còn {remainingSlots} chỗ
                              </span>
                            </div>
                            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full transition-all duration-1000 ${remainingSlots <= 5 ? "bg-red-500" : "bg-emerald-500"}`}
                                style={{
                                  width: `${Math.min(100, (remainingSlots / tour.maxGroupSize) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center">
                            {tour.isSaleActive ? (
                              <>
                                <span className="text-slate-400 text-[11px] line-through font-bold decoration-red-400/30">
                                  {Number(tour.originalPrice || tour.price)?.toLocaleString()}đ
                                </span>
                                <span className="text-red-500 font-black text-xl tracking-tighter">
                                  {Number(tour.salePrice || tour.price)?.toLocaleString()}
                                  <small className="text-[10px] ml-0.5 uppercase">
                                    đ
                                  </small>
                                </span>
                              </>
                            ) : (
                              <span className="text-blue-600 font-black text-xl tracking-tighter">
                                {tour.price?.toLocaleString()}
                                <small className="text-[10px] ml-0.5 uppercase">
                                  đ
                                </small>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => navigate(`/tours/${buildTourSlug(tour)}`)}
                            className="bg-[#1e3a8a] hover:bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 shadow-xl shadow-blue-200 ml-auto"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchX size={48} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
              Không tìm thấy tour phù hợp
            </h3>
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 w-fit mx-auto px-4 py-2 rounded-xl mb-8 border border-amber-100">
              <AlertCircle size={16} />
              <p className="text-xs font-bold uppercase">
                Gợi ý: Thử chọn "Tất cả" sở thích hoặc giảm số khách
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
