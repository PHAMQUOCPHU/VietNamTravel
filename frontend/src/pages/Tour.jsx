import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Palmtree,
  Mountain,
  UtensilsCrossed,
  Landmark,
  Leaf,
  Bike,
  SearchX,
  SlidersHorizontal,
  MapPinned,
} from "lucide-react";
import TourCard from "../components/TourCard";
import { AppContext } from "../context/AppContext";
import {
  TOUR_CATEGORY_LABELS,
  normalizeTourCategory,
} from "../constants/tourCategories.js";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const REGIONS = [
  { value: "Bắc", label: "Miền Bắc" },
  { value: "Trung", label: "Miền Trung" },
  { value: "Nam", label: "Miền Nam" },
];

/** Giá hiển thị trên card (ưu tiên giá sale khi đang khuyến mãi) */
const getTourListPrice = (tour) => {
  if (tour?.isSaleActive) {
    return Number(tour.salePrice ?? tour.price ?? 0);
  }
  return Number(tour.price ?? 0);
};

const formatVnd = (n) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
    Math.round(Number(n) || 0),
  );

const CATEGORY_FILTERS = [
  { key: "", label: "Tất cả", icon: LayoutGrid },
  {
    key: "Nghỉ dưỡng",
    label: TOUR_CATEGORY_LABELS["Nghỉ dưỡng"],
    icon: Palmtree,
  },
  { key: "Khám phá", label: TOUR_CATEGORY_LABELS["Khám phá"], icon: Mountain },
  {
    key: "Ẩm thực",
    label: TOUR_CATEGORY_LABELS["Ẩm thực"],
    icon: UtensilsCrossed,
  },
  {
    key: "Văn hóa – lịch sử",
    label: TOUR_CATEGORY_LABELS["Văn hóa – lịch sử"],
    icon: Landmark,
  },
  { key: "Sinh thái", label: TOUR_CATEGORY_LABELS["Sinh thái"], icon: Leaf },
  {
    key: "Phượt / mạo hiểm",
    label: TOUR_CATEGORY_LABELS["Phượt / mạo hiểm"],
    icon: Bike,
  },
];

const CategoryFilter = ({ selectedCategory, setSelectedCategory }) => {
  const handleSelect = (key) => {
    setSelectedCategory(key);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 px-2 sm:px-4">
      {CATEGORY_FILTERS.map((item) => {
        const Icon = item.icon;
        const isActive = selectedCategory === item.key;
        return (
          <button
            key={item.key || "all"}
            type="button"
            onClick={() => handleSelect(item.key)}
            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-300 min-w-[76px] sm:min-w-[88px] max-w-[120px] border-2 shadow-sm
              ${
                isActive
                  ? "bg-blue-600 text-white border-transparent scale-105 shadow-blue-200 shadow-lg font-bold"
                  : "bg-white text-gray-600 border-gray-100 hover:border-blue-300 hover:text-blue-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700"
              }`}
          >
            <Icon size={20} className="sm:w-[22px] sm:h-[22px] shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-bold mt-1.5 text-center leading-tight line-clamp-2">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const TourFiltersSidebar = ({
  toursForBounds,
  priceMin,
  priceMax,
  sliderMax,
  setPriceMin,
  setPriceMax,
  selectedRegions,
  toggleRegion,
  clearRegionFilter,
  resetPriceRange,
}) => {
  const regionCounts = useMemo(() => {
    const c = { Bắc: 0, Trung: 0, Nam: 0 };
    for (const t of toursForBounds) {
      const r = t.region;
      if (r && c[r] !== undefined) c[r] += 1;
    }
    return c;
  }, [toursForBounds]);

  const hasRegionSelection = selectedRegions.size > 0;

  return (
    <aside className="w-full max-w-[min(100%,260px)] mx-auto space-y-4 lg:sticky lg:top-24 lg:mx-0 lg:w-[210px] lg:max-w-[210px] lg:shrink-0 self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
          <SlidersHorizontal size={16} className="shrink-0 text-blue-600" />
          <h2 className="text-[11px] font-black uppercase tracking-wide leading-tight">
            Lọc theo giá
          </h2>
        </div>
        <p className="mb-2.5 text-center text-[11px] font-semibold leading-snug text-slate-600 dark:text-slate-300">
          Giá {formatVnd(priceMin)} – {formatVnd(priceMax)} đ
        </p>
        <div className="space-y-2.5">
          <div>
            <label className="mb-0.5 block text-[9px] font-bold uppercase text-slate-400">
              Từ (đ)
            </label>
            <input
              type="range"
              min={0}
              max={sliderMax}
              value={Math.min(priceMin, priceMax)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPriceMin(v);
                if (v > priceMax) setPriceMax(v);
              }}
              className="h-2 w-full cursor-pointer accent-blue-600"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-[9px] font-bold uppercase text-slate-400">
              Đến (đ)
            </label>
            <input
              type="range"
              min={0}
              max={sliderMax}
              value={Math.max(priceMin, priceMax)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPriceMax(v);
                if (v < priceMin) setPriceMin(v);
              }}
              className="h-2 w-full cursor-pointer accent-blue-600"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={resetPriceRange}
          className="mt-3 w-full rounded-lg border border-slate-200 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Đặt lại khoảng giá
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-2 flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
          <MapPinned size={16} className="shrink-0 text-blue-600" />
          <h2 className="text-[11px] font-black uppercase tracking-wide leading-tight">
            Vùng miền
          </h2>
        </div>

        <ul className="space-y-1">
          {REGIONS.map(({ value, label }) => {
            const checked = selectedRegions.has(value);
            const count = regionCounts[value] ?? 0;
            return (
              <li key={value}>
                <label className="flex cursor-pointer items-center justify-between gap-1 rounded-lg border border-transparent px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRegion(value)}
                      className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {label}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-400">
                    {count}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {hasRegionSelection && (
          <button
            type="button"
            onClick={clearRegionFilter}
            className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Bỏ chọn miền
          </button>
        )}
      </div>
    </aside>
  );
};

const SORT_OPTIONS = [
  { value: "default", label: "Mặc định" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
  { value: "name-asc", label: "Tên A → Z" },
];

const Tour = () => {
  const { tours } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(20_000_000);
  const [sliderMax, setSliderMax] = useState(20_000_000);
  const [selectedRegions, setSelectedRegions] = useState(() => new Set());

  const toursByCategory = useMemo(() => {
    if (!Array.isArray(tours)) return [];
    if (!selectedCategory) return tours;
    return tours.filter(
      (t) => normalizeTourCategory(t.category) === selectedCategory,
    );
  }, [tours, selectedCategory]);

  const syncPriceBounds = useCallback(() => {
    const prices = toursByCategory.map(getTourListPrice).filter((n) => n > 0);
    const maxP = prices.length ? Math.max(...prices) : 20_000_000;
    const rounded = Math.max(1_000_000, Math.ceil(maxP / 500_000) * 500_000);
    setSliderMax(rounded);
    setPriceMin(0);
    setPriceMax(rounded);
  }, [toursByCategory]);

  useEffect(() => {
    syncPriceBounds();
  }, [syncPriceBounds]);

  const toggleRegion = (value) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const clearRegionFilter = () => setSelectedRegions(new Set());

  const resetPriceRange = () => {
    setPriceMin(0);
    setPriceMax(sliderMax);
  };

  const filteredTours = useMemo(() => {
    let list = toursByCategory.filter((t) => {
      const p = getTourListPrice(t);
      return p >= priceMin && p <= priceMax;
    });
    if (selectedRegions.size > 0) {
      list = list.filter((t) => selectedRegions.has(t.region));
    }
    const arr = [...list];
    if (sortBy === "price-asc") {
      arr.sort((a, b) => getTourListPrice(a) - getTourListPrice(b));
    } else if (sortBy === "price-desc") {
      arr.sort((a, b) => getTourListPrice(b) - getTourListPrice(a));
    } else if (sortBy === "name-asc") {
      arr.sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""), "vi"),
      );
    }
    return arr;
  }, [toursByCategory, priceMin, priceMax, selectedRegions, sortBy]);

  const emptyLabel = selectedCategory
    ? TOUR_CATEGORY_LABELS[selectedCategory] || selectedCategory
    : "";

  const hasActiveFilters =
    selectedCategory ||
    selectedRegions.size > 0 ||
    priceMin > 0 ||
    priceMax < sliderMax;

  const clearAllFilters = () => {
    setSelectedCategory("");
    clearRegionFilter();
    setSortBy("default");
    const all = Array.isArray(tours) ? tours : [];
    const prices = all.map(getTourListPrice).filter((n) => n > 0);
    const maxP = prices.length ? Math.max(...prices) : 20_000_000;
    const rounded = Math.max(1_000_000, Math.ceil(maxP / 500_000) * 500_000);
    setSliderMax(rounded);
    setPriceMin(0);
    setPriceMax(rounded);
  };

  return (
    <div className="pb-20 bg-white dark:bg-slate-950 transition-colors duration-300">
      <motion.div
        className="relative bg-cover bg-center bg-no-repeat h-64 sm:h-80 lg:h-96 mb-12"
        style={{ backgroundImage: "url('/tour.jpg')" }}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <motion.h1
          className="text-3xl sm:text-4xl font-semibold mb-4 text-center text-gray-100 absolute inset-0 flex items-center justify-center uppercase tracking-widest px-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Tất Cả Tour Du Lịch
        </motion.h1>
      </motion.div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <p className="text-center text-sm text-slate-500 mb-3 font-semibold">
          Lọc theo loại hình
        </p>
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          <TourFiltersSidebar
            toursForBounds={toursByCategory}
            priceMin={priceMin}
            priceMax={priceMax}
            sliderMax={sliderMax}
            setPriceMin={setPriceMin}
            setPriceMax={setPriceMax}
            selectedRegions={selectedRegions}
            toggleRegion={toggleRegion}
            clearRegionFilter={clearRegionFilter}
            resetPriceRange={resetPriceRange}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {filteredTours.length > 0 ? (
                  <>
                    Tìm thấy{" "}
                    <span className="font-black text-blue-600 dark:text-blue-400">
                      {filteredTours.length}
                    </span>{" "}
                    tour
                  </>
                ) : (
                  "Không có tour phù hợp"
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Sắp xếp
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mb-4 text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                Xóa bộ lọc
              </button>
            )}

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <AnimatePresence mode="popLayout">
                {filteredTours && filteredTours.length > 0 ? (
                  filteredTours.map((tour, index) => (
                    <motion.div
                      key={tour._id || index}
                      layout
                      initial="hidden"
                      animate="visible"
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                      variants={slideUp}
                      transition={{ delay: 0.05 * index, duration: 0.5 }}
                    >
                      <TourCard tour={tour} />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 dark:bg-slate-900 dark:border-slate-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-center mb-4 text-gray-300 dark:text-slate-600">
                      <SearchX size={64} strokeWidth={1} />
                    </div>
                    <p className="text-gray-500 font-medium dark:text-slate-300 px-4">
                      {Array.isArray(tours) && tours.length === 0
                        ? "Đang tải danh sách tour từ hệ thống..."
                        : selectedCategory
                          ? `Hiện chưa có tour nào thuộc loại «${emptyLabel}» với bộ lọc hiện tại.`
                          : "Thử nới khoảng giá hoặc bỏ lọc miền để xem thêm tour."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-4 text-blue-600 font-bold hover:underline transition-all"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tour;
