import React, { useState, useMemo, useEffect, useContext, useRef } from "react";
import {
  MapPin,
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
  const containerRef = useRef(null);

  const [searchData, setSearchData] = useState({
    region: "",
    province: "",
    startDate: "",
    endDate: "",
    preference: "",
    adults: 1,
    children: 0,
  });

  const citiesInSystem = useMemo(() => {
    if (!Array.isArray(tours)) return [];
    const set = new Set();
    for (const t of tours) {
      const c = t?.city;
      if (c && String(c).trim()) set.add(String(c).trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "vi"));
  }, [tours]);

  const provincesByRegion = useMemo(() => {
    if (!Array.isArray(tours)) return [];
    const want = String(searchData.region || "").trim();
    const set = new Set();
    for (const t of tours) {
      if (!t) continue;
      if (want && String(t.region || "").trim() !== want) continue;
      const c = t?.city;
      if (c && String(c).trim()) set.add(String(c).trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "vi"));
  }, [tours, searchData.region]);

  const regionDisplayLabel = useMemo(() => {
    const found = REGION_OPTIONS.find((o) => o.value === searchData.region);
    return found?.label ?? "Vùng miền";
  }, [searchData.region]);

  useEffect(() => {
    if (!searchData.startDate || !searchData.endDate) return;
    if (searchData.endDate < searchData.startDate) {
      setSearchData((prev) => ({ ...prev, endDate: prev.startDate }));
    }
  }, [searchData.startDate, searchData.endDate]);

  useEffect(() => {
    // Nếu đang chọn tỉnh nhưng đổi vùng miền khiến tỉnh đó không còn phù hợp → reset.
    const prov = String(searchData.province || "").trim();
    if (!prov) return;
    if (searchData.region && provincesByRegion.length > 0 && !provincesByRegion.includes(prov)) {
      setSearchData((prev) => ({ ...prev, province: "" }));
    }
  }, [searchData.region, searchData.province, provincesByRegion]);

  const handleSearch = () => {
    const normalized = {
      ...searchData,
      adults: Math.max(1, Number(searchData.adults) || 1),
      children: Math.max(0, Number(searchData.children) || 0),
      region: String(searchData.region || "").trim(),
      province: String(searchData.province || "").trim(),
      preference: String(searchData.preference || "").trim(),
      startDate: String(searchData.startDate || "").trim(),
      endDate: String(searchData.endDate || "").trim(),
    };

    const params = new URLSearchParams();
    if (normalized.region) params.set("region", normalized.region);
    if (normalized.province) params.set("province", normalized.province);
    if (normalized.startDate) params.set("startDate", normalized.startDate);
    if (normalized.endDate) params.set("endDate", normalized.endDate);
    if (normalized.preference) params.set("preference", normalized.preference);
    params.set("adults", String(normalized.adults));
    params.set("children", String(normalized.children));

    navigate(`/tours/search?${params.toString()}`, { state: normalized });
  };

  useEffect(() => {
    const onDocDown = (e) => {
      const root = containerRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setShowDest(false);
      setShowGuests(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="max-w-5xl mx-auto px-2 sm:px-4 mt-6 sm:mt-8 md:-mt-10 relative z-50"
    >
      <div className="bg-white/95 backdrop-blur-md md:rounded-full rounded-2xl sm:rounded-3xl shadow-[0_22px_55px_rgba(30,58,138,0.18)] p-1.5 sm:p-2 border border-blue-100 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:bg-slate-900/95 dark:border-slate-700 dark:divide-slate-700 w-full gap-1 md:gap-0">
        {/* 1. Điểm đến (Kết hợp Region & Province) */}
        <div
          className="relative px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 w-full md:w-auto flex-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg md:rounded-full cursor-pointer transition-colors"
          onClick={() => setShowDest(!showDest)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <MapPin className="text-blue-600 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Điểm đến
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
                {searchData.province ||
                  regionDisplayLabel ||
                  "Tìm kiếm địa điểm"}
              </span>
            </div>
          </div>
          <AnimatePresence>
            {showDest && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 top-full z-50 mt-2 flex w-[min(100%,18rem)] max-w-[calc(100vw-1rem)] flex-col gap-3 rounded-xl border border-blue-100 bg-white p-3 shadow-2xl dark:border-slate-600 dark:bg-slate-900 sm:mt-3 sm:w-72 sm:max-w-none sm:rounded-2xl sm:p-4 sm:gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Vùng miền
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {REGION_OPTIONS.map((o) => (
                      <button
                        key={o.value || "all"}
                        type="button"
                        onClick={() =>
                          setSearchData((prev) => ({
                            ...prev,
                            region: o.value,
                          }))
                        }
                        className={`text-left py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-colors ${searchData.region === o.value ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Tỉnh thành
                  </p>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700"
                    value={searchData.province}
                    onChange={(e) => {
                      setSearchData((prev) => ({
                        ...prev,
                        province: e.target.value,
                      }));
                      setShowDest(false);
                    }}
                  >
                    <option value="">Tất cả tỉnh thành</option>
                    {(searchData.region ? provincesByRegion : citiesInSystem).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Thời gian */}
        <div className="relative px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 w-full md:w-auto flex-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg md:rounded-full cursor-pointer transition-colors">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="text-blue-600 shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Thời gian
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={searchData.startDate}
                  className="bg-transparent text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  onChange={(e) =>
                    setSearchData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
                <span className="text-xs font-black text-slate-300 dark:text-slate-600">
                  –
                </span>
                <input
                  type="date"
                  value={searchData.endDate}
                  min={searchData.startDate || undefined}
                  className="bg-transparent text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                  onChange={(e) =>
                    setSearchData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Loại hình */}
        <div className="relative w-full flex-1 cursor-pointer rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-4 sm:py-3 md:w-auto md:rounded-full md:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Compass className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" strokeWidth={2} />
            <div className="flex min-w-0 w-full flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 sm:text-[10px]">
                Loại hình
              </span>
              <select
                className="w-full cursor-pointer appearance-none bg-transparent text-xs font-extrabold text-slate-800 outline-none dark:text-slate-100 sm:text-sm"
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

        {/* 4. Hành khách */}
        <div
          className="relative w-full flex-1 cursor-pointer rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-4 sm:py-3 md:w-auto md:rounded-full md:px-6"
          onClick={() => setShowGuests(!showGuests)}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5" strokeWidth={2} />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 sm:text-[10px]">
                Khách
              </span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 sm:text-sm">
                {searchData.adults + searchData.children} người
              </span>
            </div>
          </div>
          <AnimatePresence>
            {showGuests && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full z-50 mt-3 w-[min(100%,16rem)] max-w-[calc(100vw-1.25rem)] rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl dark:border-slate-600 dark:bg-slate-900 sm:w-64 sm:max-w-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Người lớn
                      </p>
                      <p className="text-[10px] text-gray-400">Từ 12 tuổi</p>
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
                        className="w-8 h-8 border border-slate-200 rounded-full flex justify-center items-center font-bold hover:border-slate-800"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-4 text-center">
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
                        className="w-8 h-8 border border-slate-200 rounded-full flex justify-center items-center font-bold hover:border-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Trẻ em
                      </p>
                      <p className="text-[10px] text-gray-400">Dưới 12 tuổi</p>
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
                        className="w-8 h-8 border border-slate-200 rounded-full flex justify-center items-center font-bold hover:border-slate-800"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-4 text-center">
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
                        className="w-8 h-8 border border-slate-200 rounded-full flex justify-center items-center font-bold hover:border-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuests(false)}
                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Xong
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. Nút Search */}
        <div className="p-1.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full md:w-14 md:h-14 py-3 md:py-0 bg-blue-600 hover:bg-blue-700 text-white md:rounded-full rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/40 transition-all active:scale-95 group"
          >
            <Search
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="font-bold md:hidden">Tìm kiếm</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
