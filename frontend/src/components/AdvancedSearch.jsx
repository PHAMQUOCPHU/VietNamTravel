import React, { useState, useMemo, useEffect, useContext } from "react";
import {
  MapPin,
  Navigation,
  Calendar,
  Compass,
  Users,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  TOUR_CATEGORY_VALUES,
  TOUR_CATEGORY_LABELS,
} from "../constants/tourCategories.js";

/** Khớp field `region` trong MongoDB: Bắc | Trung | Nam */
const REGION_OPTIONS = [
  { value: "", label: "Tất cả điểm đến" },
  { value: "Bắc", label: "Miền Bắc" },
  { value: "Trung", label: "Miền Trung" },
  { value: "Nam", label: "Miền Nam" },
];

const AdvancedSearch = () => {
  const navigate = useNavigate();
  const { tours } = useContext(AppContext);
  const [showDest, setShowDest] = useState(false);
  const [showGuests, setShowGuests] = useState(false);

  /** Các `city` thực tế có trong hệ thống (field tour.city) */
  const citiesInSystem = useMemo(() => {
    if (!Array.isArray(tours)) return [];
    const set = new Set();
    for (const t of tours) {
      const c = t?.city;
      if (c && String(c).trim()) set.add(String(c).trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "vi"));
  }, [tours]);

  const [searchData, setSearchData] = useState({
    region: "",
    province: "",
    startDate: "",
    endDate: "",
    preference: "",
    adults: 1,
    children: 0,
  });

  const regionDisplayLabel = useMemo(() => {
    const found = REGION_OPTIONS.find((o) => o.value === searchData.region);
    return found?.label ?? "Tất cả điểm đến";
  }, [searchData.region]);

  useEffect(() => {
    if (!searchData.startDate || !searchData.endDate) return;
    if (searchData.endDate < searchData.startDate) {
      setSearchData((prev) => ({ ...prev, endDate: prev.startDate }));
    }
  }, [searchData.startDate, searchData.endDate]);

  const handleSearch = () => {
    navigate("/tours/search", { state: searchData });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 -mt-14 relative z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-[30px] shadow-[0_22px_55px_rgba(30,58,138,0.18)] p-4 border border-blue-100 dark:border-slate-700 dark:bg-slate-900/95">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
          {/* 1. VÙNG MIỀN — giá trị khớp tour.region */}
          <div
            className="relative p-4 border-r border-gray-100 dark:border-slate-700 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all rounded-2xl cursor-pointer min-h-[92px] flex items-center"
            onClick={() => setShowDest(!showDest)}
          >
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-600 shrink-0" size={22} />
              <div className="overflow-hidden min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Vùng miền
                </p>
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {regionDisplayLabel}
                </p>
              </div>
            </div>
            <AnimatePresence>
              {showDest && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 shadow-2xl rounded-xl p-3 border border-blue-100 dark:border-slate-600 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {REGION_OPTIONS.map((o) => (
                    <button
                      key={o.value || "all"}
                      type="button"
                      onClick={() => {
                        setSearchData((prev) => ({ ...prev, region: o.value }));
                        setShowDest(false);
                      }}
                      className="w-full text-left py-2 px-3 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. TỈNH THÀNH — chỉ các địa danh đang có tour */}
          <div className="p-3 border-r border-gray-100 dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all rounded-xl min-h-[92px] flex items-center">
            <div className="flex items-center gap-3 w-full min-w-0">
              <Navigation className="text-blue-600 shrink-0" size={22} />
              <div className="w-full min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Tỉnh / Thành phố
                </p>
                <select
                  className="bg-transparent text-base font-extrabold text-slate-800 dark:text-slate-100 outline-none w-full appearance-none cursor-pointer truncate"
                  value={searchData.province}
                  onChange={(e) =>
                    setSearchData((prev) => ({
                      ...prev,
                      province: e.target.value,
                    }))
                  }
                >
                  <option value="">Tất cả tỉnh thành</option>
                  {citiesInSystem.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. KHOẢNG THỜI GIAN — slot lịch tour: YYYY-MM-DD|HH:mm */}
          <div className="p-4 border-r border-gray-100 dark:border-slate-700 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all rounded-2xl min-h-[92px]">
            <div className="flex items-start gap-3">
              <Calendar className="text-blue-600 mt-1 shrink-0" size={20} />
              <div className="flex flex-col gap-1 w-full min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Ngày khởi hành
                </p>
                <div className="flex flex-col gap-1">
                  <input
                    type="date"
                    value={searchData.startDate}
                    className="text-xs font-bold text-blue-700 dark:text-blue-300 outline-none bg-blue-50/60 dark:bg-slate-800 p-1.5 rounded-lg cursor-pointer w-full"
                    onChange={(e) =>
                      setSearchData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    value={searchData.endDate}
                    min={searchData.startDate || undefined}
                    className="text-xs font-bold text-blue-700 dark:text-blue-300 outline-none bg-blue-50/60 dark:bg-slate-800 p-1.5 rounded-lg cursor-pointer w-full"
                    onChange={(e) =>
                      setSearchData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  (Tuỳ chọn) Có ít nhất một ngày khởi hành trong khoảng
                </p>
              </div>
            </div>
          </div>

          {/* 4. LOẠI HÌNH — khớp tour.category */}
          <div className="p-4 border-r border-gray-100 dark:border-slate-700 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all rounded-2xl min-h-[92px] flex items-center">
            <div className="flex items-center gap-3 w-full min-w-0">
              <Compass className="text-blue-600 shrink-0" size={22} />
              <div className="w-full min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Loại hình
                </p>
                <select
                  className="bg-transparent text-base font-extrabold text-slate-800 dark:text-slate-100 outline-none w-full appearance-none cursor-pointer truncate"
                  value={searchData.preference}
                  onChange={(e) =>
                    setSearchData((prev) => ({
                      ...prev,
                      preference: e.target.value,
                    }))
                  }
                >
                  <option value="">Tất cả loại hình</option>
                  {TOUR_CATEGORY_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {TOUR_CATEGORY_LABELS[v] || v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 5. HÀNH KHÁCH — so với chỗ còn lại (maxGroupSize − joinedParticipants) */}
          <div
            className="relative p-4 border-r border-gray-100 dark:border-slate-700 hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-all rounded-2xl cursor-pointer min-h-[92px] flex items-center"
            onClick={() => setShowGuests(!showGuests)}
          >
            <div className="flex items-center gap-3">
              <Users className="text-blue-600 shrink-0" size={22} />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Khách
                </p>
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {searchData.adults + searchData.children} người
                </p>
              </div>
            </div>
            <AnimatePresence>
              {showGuests && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl p-4 border border-blue-100 dark:border-slate-600 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Người lớn
                        </p>
                        <p className="text-[9px] text-gray-400">Từ 12 tuổi</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSearchData((prev) => ({
                              ...prev,
                              adults: Math.max(1, prev.adults - 1),
                            }))
                          }
                          className="w-7 h-7 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center">
                          {searchData.adults}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSearchData((prev) => ({
                              ...prev,
                              adults: prev.adults + 1,
                            }))
                          }
                          className="w-7 h-7 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          Trẻ em
                        </p>
                        <p className="text-[9px] text-blue-400/90">
                          Dưới 12 tuổi
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSearchData((prev) => ({
                              ...prev,
                              children: Math.max(0, prev.children - 1),
                            }))
                          }
                          className="w-7 h-7 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center">
                          {searchData.children}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSearchData((prev) => ({
                              ...prev,
                              children: prev.children + 1,
                            }))
                          }
                          className="w-7 h-7 border border-slate-100 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuests(false)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      Xác nhận
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/40 transition-all active:scale-95 group"
            >
              <Search
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-black uppercase text-sm tracking-tight">
                Tìm kiếm
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
