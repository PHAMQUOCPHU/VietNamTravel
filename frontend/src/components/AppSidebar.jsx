import React, { useEffect, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  ChevronRight,
  Home,
  ArrowLeft,
  Heart,
  User,
  DollarSign,
  BookImage,
  Briefcase,
  Cloud,
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  Search,
  Loader2,
} from "lucide-react";
import VoucherCard from "./VoucherCard";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  fetchOpenWeatherForecast,
  fetchOpenWeatherGeo,
  getPublicVouchers,
} from "../services";
import { resolveSiteLogoSrc } from "../utils/siteLogo";
import {
  CITY_COORD_FALLBACK,
  WEATHER_CITY_QUERY_MAP,
  getWeatherIcon,
  normWeatherCityKey,
  pickGeoResult,
} from "../pages/tour-details/weatherUtils";

const AppSidebar = ({ isOpen, onClose }) => {
  const { backendUrl, user, token, siteConfig } = useContext(AppContext);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("menu"); // 'menu' | 'vouchers' | 'exchange' | 'weather'
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [exchangeCurrency, setExchangeCurrency] = useState("USD");

  // --- Weather state (OpenWeather) ---
  const [weatherCity, setWeatherCity] = useState(() => {
    try {
      return localStorage.getItem("vt_weather_city") || "Đà Nẵng";
    } catch {
      return "Đà Nẵng";
    }
  });
  const [weatherQuery, setWeatherQuery] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherData, setWeatherData] = useState(null);

  const exchangeRates = {
    USD: 25430,
    EUR: 27150,
    JPY: 168,
    CNY: 3520,
    GBP: 31800,
  };

  const exchangedValue =
    (parseFloat(exchangeAmount) || 0) * exchangeRates[exchangeCurrency];

  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    setView("menu");
    setWeatherQuery("");
    const ac = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPublicVouchers({
          backendUrl,
          token,
          signal: ac.signal,
        });
        if (!ac.signal.aborted && data.success) {
          setVouchers(data.vouchers);
        }
      } catch (error) {
        if (error.code !== "ERR_CANCELED" && error.name !== "CanceledError") {
          console.error(error);
        }
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => ac.abort();
  }, [isOpen, backendUrl, token]);

  const loadWeather = async (nextCity) => {
    const city = String(nextCity || "").trim();
    if (!city) return;
    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    if (!API_KEY) {
      setWeatherError("Thiếu cấu hình VITE_WEATHER_API_KEY để tải thời tiết.");
      setWeatherData(null);
      return;
    }

    const ac = new AbortController();
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const cityNorm = normWeatherCityKey(city);
      const mappedCandidates = WEATHER_CITY_QUERY_MAP[cityNorm] || [];
      const candidates = Array.from(
        new Set([...mappedCandidates, `${city}, VN`, city]),
      ).filter(Boolean);

      let foundCoord = null;
      for (const q of candidates) {
        const geo = await fetchOpenWeatherGeo({
          q,
          limit: 5,
          apiKey: API_KEY,
          signal: ac.signal,
        });
        const picked = pickGeoResult(geo);
        if (picked) {
          foundCoord = picked;
          break;
        }
      }

      const fallback = CITY_COORD_FALLBACK[cityNorm];
      if (!foundCoord && fallback) {
        foundCoord = { lat: fallback.lat, lon: fallback.lon, country: "VN" };
      }
      if (!foundCoord) {
        setWeatherError("Không tìm thấy địa điểm. Hãy thử nhập tên tỉnh/thành khác.");
        setWeatherData(null);
        return;
      }

      const forecast = await fetchOpenWeatherForecast({
        lat: foundCoord.lat,
        lon: foundCoord.lon,
        apiKey: API_KEY,
        units: "metric",
        lang: "vi",
        signal: ac.signal,
      });

      setWeatherData({
        city,
        coord: { lat: foundCoord.lat, lon: foundCoord.lon },
        forecast,
      });
      setWeatherCity(city);
      try {
        localStorage.setItem("vt_weather_city", city);
      } catch {
        // ignore
      }
    } catch (err) {
      setWeatherError(err?.message || "Không tải được thời tiết lúc này.");
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
      ac.abort();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (view !== "weather") return;
    // Lazy load when open weather view
    loadWeather(weatherCity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, view]);

  const handleUseNow = (code) => {
    navigator.clipboard.writeText(code);
    onClose();
    navigate("/tours");
  };

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };

  const logoSrc = resolveSiteLogoSrc(siteConfig?.logoUrl);

  const validVouchersCount = vouchers.filter((v) => {
    const limit = Math.max(1, Number(v.usageLimit) || 1);
    const isExhausted = (Number(v.usedCount) || 0) >= limit;
    const isUsedByUser =
      Boolean(v.usedByMe) ||
      !!(user?._id && v.usedBy?.some((id) => String(id) === String(user._id)));
    const isExpired = new Date(v.expiryDate) < new Date();
    return !isExhausted && !isUsedByUser && !isExpired;
  }).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[340px] max-w-[85vw] bg-white z-[100] shadow-2xl flex flex-col overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {view === "menu" ? (
                <motion.div
                  key="menu"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  <div className="bg-white px-5 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm z-10 gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={logoSrc}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-gray-100"
                      />
                      <h2 className="truncate text-xl font-extrabold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                        VietNam Travel
                      </h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <button
                      onClick={() => setView("vouchers")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Ticket size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Kho Voucher của tôi
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {validVouchersCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {validVouchersCount}
                          </span>
                        )}
                        <ChevronRight
                          size={18}
                          className="text-gray-400 group-hover:text-blue-500"
                        />
                      </div>
                    </button>

                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                    <button
                      onClick={() => handleNavigation("/diaries")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <BookImage size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Nhật ký hành trình
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-purple-500"
                      />
                    </button>

                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                    <button
                      onClick={() => setView("weather")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Cloud size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Thời tiết hôm nay
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-blue-500"
                      />
                    </button>

                    <div className="h-px bg-gray-100 my-2 mx-2"></div>

                    <button
                      onClick={() => setView("exchange")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-200 transition-colors">
                          <DollarSign size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Đổi tỷ giá
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-emerald-500"
                      />
                    </button>

                    <button
                      onClick={() => handleNavigation("/careers")}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-sky-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 text-sky-600 rounded-lg group-hover:bg-sky-200 transition-colors">
                          <Briefcase size={20} />
                        </div>
                        <span className="font-bold text-gray-800">
                          Tuyển dụng
                        </span>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-sky-500"
                      />
                    </button>
                  </div>
                </motion.div>
              ) : view === "vouchers" ? (
                <motion.div
                  key="vouchers"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex flex-col h-full bg-slate-50"
                >
                  <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 shadow-sm z-10 gap-3">
                    <button
                      onClick={() => setView("menu")}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-black text-gray-800">
                      Kho Voucher của tôi
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-400 font-medium">
                          Đang tải mã giảm giá...
                        </p>
                      </div>
                    ) : vouchers.length > 0 ? (
                      vouchers.map((voucher) => (
                        <VoucherCard
                          key={voucher._id}
                          voucher={voucher}
                          isSidebar={true}
                          onUseNow={handleUseNow}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium text-sm">
                          Chưa có mã giảm giá nào
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : view === "exchange" ? (
                <motion.div
                  key="exchange"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex flex-col h-full bg-slate-50"
                >
                  <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 shadow-sm z-10 gap-3">
                    <button
                      onClick={() => setView("menu")}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-black text-gray-800">
                      Đổi tỷ giá ngoại tệ
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                          Số lượng quy đổi
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={exchangeAmount}
                            onChange={(e) => setExchangeAmount(e.target.value)}
                            placeholder="Nhập số tiền..."
                            className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                          />
                          <select
                            value={exchangeCurrency}
                            onChange={(e) =>
                              setExchangeCurrency(e.target.value)
                            }
                            className="w-24 px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="JPY">JPY</option>
                            <option value="CNY">CNY</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          Kết quả (VNĐ)
                        </label>
                        <div className="text-3xl font-black text-emerald-600 break-all">
                          {exchangedValue.toLocaleString("vi-VN")}{" "}
                          <span className="text-lg text-emerald-500">đ</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 italic">
                          Tỷ giá tham khảo: 1 {exchangeCurrency} ={" "}
                          {exchangeRates[exchangeCurrency].toLocaleString(
                            "vi-VN",
                          )}{" "}
                          VNĐ
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavigation("/tours")}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                      Dùng kết quả này để đặt Tour
                    </button>

                    <div className="mt-auto text-center pt-10">
                      <p className="text-sm font-semibold text-gray-500">
                        "Tính toán dễ dàng, an tâm khám phá Việt Nam!"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : view === "weather" ? (
                <motion.div
                  key="weather"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="flex flex-col h-full bg-slate-50"
                >
                  <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 shadow-sm z-10 gap-3">
                    <button
                      onClick={() => setView("menu")}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-black text-gray-800">
                      Thời tiết hôm nay
                    </h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Tìm tỉnh / thành
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            value={weatherQuery}
                            onChange={(e) => setWeatherQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const q = weatherQuery.trim() || weatherCity;
                                loadWeather(q);
                              }
                            }}
                            placeholder="Ví dụ: Đà Nẵng, Hà Nội..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={weatherLoading}
                          onClick={() => {
                            const q = weatherQuery.trim() || weatherCity;
                            loadWeather(q);
                          }}
                          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          Xem
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Đang xem: <span className="font-bold text-slate-600">{weatherCity}</span>
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "Đà Nẵng",
                          "Hà Nội",
                          "TP. Hồ Chí Minh",
                          "Đà Lạt",
                          "Nha Trang",
                          "Vũng Tàu",
                        ].map((city) => {
                          const active = normWeatherCityKey(city) === normWeatherCityKey(weatherCity);
                          return (
                            <button
                              key={city}
                              type="button"
                              disabled={weatherLoading}
                              onClick={() => {
                                setWeatherQuery("");
                                loadWeather(city);
                              }}
                              className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
                                active
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              } disabled:opacity-60`}
                            >
                              {city}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      className="rounded-[28px] overflow-hidden shadow-lg border border-slate-200/60 text-white relative"
                    >
                      <div className="relative p-5">
                        {weatherLoading ? (
                          <div className="flex items-center gap-2 text-white/90">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-semibold">
                              Đang tải thời tiết…
                            </span>
                          </div>
                        ) : weatherError ? (
                          <div className="text-sm font-semibold text-white/95">
                            {weatherError}
                          </div>
                        ) : weatherData?.forecast?.list?.length ? (
                          (() => {
                            const forecast = weatherData.forecast;
                            const nowItem = forecast.list[0];
                            const main = nowItem?.weather?.[0]?.main;
                            const desc = nowItem?.weather?.[0]?.description || "";
                            const temp = Math.round(Number(nowItem?.main?.temp) || 0);
                            const humidity = Math.round(Number(nowItem?.main?.humidity) || 0);
                            const windMs = Number(nowItem?.wind?.speed) || 0;
                            const windKmh = Math.round(windMs * 3.6);

                            const themeKey = (() => {
                              const m = String(main || "").toLowerCase();
                              const d = String(desc || "").toLowerCase();
                              if (m.includes("thunder")) return "storm";
                              if (m.includes("rain") || m.includes("drizzle") || d.includes("mưa")) return "rain";
                              if (m.includes("snow") || d.includes("tuyết")) return "snow";
                              if (m.includes("mist") || m.includes("fog") || m.includes("haze") || d.includes("sương")) return "fog";
                              if (m.includes("cloud")) return "cloudy";
                              if (m.includes("clear") || d.includes("nắng")) return "sunny";
                              return "cloudy";
                            })();

                            const theme = (() => {
                              // Màu sắc trực quan theo trạng thái thời tiết.
                              // Nếu nhiệt độ cao, tăng "ấm" cho theme nắng/mây.
                              const isHot = Number.isFinite(temp) && temp >= 32;
                              switch (themeKey) {
                                case "storm":
                                  return {
                                    bg: "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900",
                                    border: "border-indigo-300/25",
                                    chip: "bg-white/10 border-white/10",
                                    accent: "text-violet-100",
                                    overlay: "storm",
                                  };
                                case "rain":
                                  return {
                                    bg: "bg-gradient-to-br from-sky-700 via-blue-800 to-indigo-900",
                                    border: "border-sky-200/25",
                                    chip: "bg-white/10 border-white/10",
                                    accent: "text-sky-50",
                                    overlay: "rain",
                                  };
                                case "snow":
                                  return {
                                    bg: "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700",
                                    border: "border-white/40",
                                    chip: "bg-white/30 border-white/30",
                                    accent: "text-slate-900",
                                    overlay: "snow",
                                  };
                                case "fog":
                                  return {
                                    bg: "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800",
                                    border: "border-slate-200/20",
                                    chip: "bg-white/10 border-white/10",
                                    accent: "text-slate-50",
                                    overlay: "fog",
                                  };
                                case "sunny":
                                  return {
                                    bg: isHot
                                      ? "bg-gradient-to-br from-orange-400 via-amber-500 to-sky-500"
                                      : "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
                                    border: isHot ? "border-amber-100/30" : "border-blue-100/40",
                                    chip: "bg-white/12 border-white/12",
                                    accent: "text-white",
                                    overlay: "sun",
                                  };
                                case "cloudy":
                                default:
                                  return {
                                    bg: isHot
                                      ? "bg-gradient-to-br from-amber-400 via-sky-500 to-indigo-600"
                                      : "bg-gradient-to-br from-slate-500 via-sky-600 to-indigo-700",
                                    border: "border-white/10",
                                    chip: "bg-white/10 border-white/10",
                                    accent: "text-white",
                                    overlay: "clouds",
                                  };
                              }
                            })();

                            const todayKey = new Date().toISOString().slice(0, 10);
                            const todayItems = forecast.list.filter((x) =>
                              String(x?.dt_txt || "").startsWith(todayKey),
                            );
                            const temps = todayItems.map((x) => Number(x?.main?.temp)).filter((n) => Number.isFinite(n));
                            const hi = temps.length ? Math.round(Math.max(...temps)) : temp;
                            const lo = temps.length ? Math.round(Math.min(...temps)) : temp;

                            const sunrise = forecast?.city?.sunrise
                              ? new Date(forecast.city.sunrise * 1000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                              : "--:--";
                            const sunset = forecast?.city?.sunset
                              ? new Date(forecast.city.sunset * 1000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                              : "--:--";

                            const { Icon: WxIcon } = getWeatherIcon(main);
                            const hourly = forecast.list.slice(0, 4);

                            return (
                              <>
                                {/* Nền theo trạng thái thời tiết */}
                                <div className={`absolute inset-0 ${theme.bg}`} aria-hidden />
                                <div className="absolute inset-0 opacity-90" aria-hidden>
                                  {theme.overlay === "rain" ? (
                                    <div className="vtw-rain" />
                                  ) : theme.overlay === "storm" ? (
                                    <div className="vtw-storm" />
                                  ) : theme.overlay === "clouds" ? (
                                    <div className="vtw-clouds" />
                                  ) : theme.overlay === "sun" ? (
                                    <div className="vtw-sun" />
                                  ) : theme.overlay === "fog" ? (
                                    <div className="vtw-fog" />
                                  ) : theme.overlay === "snow" ? (
                                    <div className="vtw-snow" />
                                  ) : null}
                                </div>

                                <div className={`absolute inset-0 border ${theme.border}`} aria-hidden />
                                <div className="absolute inset-0 bg-black/10" aria-hidden />

                                <div className="relative">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-white/95">
                                      <span className="text-sm font-bold tracking-wide">
                                        {weatherData.city}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex items-end gap-2">
                                      <div className="text-6xl font-black leading-none">
                                        {temp}°
                                      </div>
                                      <div className="pb-2 text-xl font-black opacity-95">
                                        C
                                      </div>
                                    </div>
                                    <p className={`mt-2 text-base font-semibold ${theme.accent}`}>
                                      {desc ? desc[0].toUpperCase() + desc.slice(1) : "Thời tiết"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-white/80">
                                      H:{hi}° &nbsp;&nbsp; L:{lo}°
                                    </p>
                                  </div>
                                  <div className={`h-20 w-20 rounded-2xl border ${theme.chip} flex items-center justify-center backdrop-blur-sm`}>
                                    <WxIcon className="h-10 w-10 text-white/95" />
                                  </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                  <div className={`rounded-2xl border ${theme.chip} p-4 backdrop-blur-sm`}>
                                    <div className="flex items-center gap-2 text-white/85 text-sm font-semibold">
                                      <Droplets className="h-4 w-4" />
                                      Độ ẩm
                                    </div>
                                    <div className="mt-2 text-2xl font-black">
                                      {humidity}%
                                    </div>
                                  </div>
                                  <div className={`rounded-2xl border ${theme.chip} p-4 backdrop-blur-sm`}>
                                    <div className="flex items-center gap-2 text-white/85 text-sm font-semibold">
                                      <Wind className="h-4 w-4" />
                                      Gió
                                    </div>
                                    <div className="mt-2 text-2xl font-black">
                                      {windKmh} km/h
                                    </div>
                                  </div>
                                  <div className={`rounded-2xl border ${theme.chip} p-4 backdrop-blur-sm`}>
                                    <div className="flex items-center gap-2 text-white/85 text-sm font-semibold">
                                      <Sunrise className="h-4 w-4" />
                                      Bình minh
                                    </div>
                                    <div className="mt-2 text-2xl font-black">
                                      {sunrise}
                                    </div>
                                  </div>
                                  <div className={`rounded-2xl border ${theme.chip} p-4 backdrop-blur-sm`}>
                                    <div className="flex items-center gap-2 text-white/85 text-sm font-semibold">
                                      <Sunset className="h-4 w-4" />
                                      Hoàng hôn
                                    </div>
                                    <div className="mt-2 text-2xl font-black">
                                      {sunset}
                                    </div>
                                  </div>
                                </div>

                                <div className={`mt-5 rounded-2xl border ${theme.chip} p-4 backdrop-blur-sm`}>
                                  <p className="text-sm font-extrabold text-white/90">
                                    Dự báo theo giờ
                                  </p>
                                  <div className="mt-4 grid grid-cols-4 gap-3">
                                    {hourly.map((h, idx) => {
                                      const t = String(h?.dt_txt || "").slice(11, 16) || "--:--";
                                      const tTemp = Math.round(Number(h?.main?.temp) || 0);
                                      const { Icon: HIcon } = getWeatherIcon(h?.weather?.[0]?.main);
                                      return (
                                        <div
                                          key={`${h?.dt_txt}-${idx}`}
                                          className={`rounded-2xl border ${theme.chip} p-3 text-center`}
                                        >
                                          <div className="text-xs font-bold text-white/80">
                                            {t}
                                          </div>
                                          <div className="mt-2 flex justify-center">
                                            <HIcon className="h-5 w-5 text-white/90" />
                                          </div>
                                          <div className="mt-2 text-lg font-black">
                                            {tTemp}°
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                </div>
                              </>
                            );
                          })()
                        ) : (
                          <div className="text-sm font-semibold text-white/95">
                            Chưa có dữ liệu thời tiết.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Weather overlays (scoped) */}
      <style>{`
        .vtw-rain {
          position: absolute;
          inset: -40px;
          background-image:
            repeating-linear-gradient(
              105deg,
              rgba(255,255,255,0.00) 0px,
              rgba(255,255,255,0.00) 8px,
              rgba(255,255,255,0.18) 9px,
              rgba(255,255,255,0.18) 10px
            );
          opacity: 0.55;
          transform: rotate(-8deg);
          animation: vtw-rain-move 1.1s linear infinite;
        }
        @keyframes vtw-rain-move {
          from { background-position: 0px 0px; }
          to { background-position: 0px 120px; }
        }
        .vtw-storm {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 55%),
            radial-gradient(circle at 70% 30%, rgba(99,102,241,0.22), transparent 60%),
            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.06), transparent 55%);
          animation: vtw-storm-pulse 2.2s ease-in-out infinite;
          opacity: 0.9;
        }
        @keyframes vtw-storm-pulse {
          0%, 100% { filter: brightness(1); }
          45% { filter: brightness(1.06); }
          50% { filter: brightness(1.18); }
          55% { filter: brightness(1.05); }
        }
        .vtw-clouds {
          position: absolute;
          inset: -20px;
          background:
            radial-gradient(circle at 15% 35%, rgba(255,255,255,0.20), transparent 55%),
            radial-gradient(circle at 55% 20%, rgba(255,255,255,0.16), transparent 60%),
            radial-gradient(circle at 78% 55%, rgba(255,255,255,0.18), transparent 55%),
            radial-gradient(circle at 35% 70%, rgba(255,255,255,0.12), transparent 55%);
          filter: blur(1px);
          opacity: 0.75;
          animation: vtw-clouds-drift 8s ease-in-out infinite;
        }
        @keyframes vtw-clouds-drift {
          0%, 100% { transform: translateX(-6px); }
          50% { transform: translateX(10px); }
        }
        .vtw-sun {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 78% 18%, rgba(255,255,255,0.18), transparent 55%),
            radial-gradient(circle at 82% 22%, rgba(251,191,36,0.35), transparent 48%),
            radial-gradient(circle at 18% 78%, rgba(255,255,255,0.06), transparent 55%);
          animation: vtw-sun-glow 3.4s ease-in-out infinite;
          opacity: 0.95;
        }
        @keyframes vtw-sun-glow {
          0%, 100% { filter: saturate(1) brightness(1); }
          50% { filter: saturate(1.15) brightness(1.08); }
        }
        .vtw-fog {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.02)),
            radial-gradient(circle at 35% 45%, rgba(255,255,255,0.16), transparent 60%),
            radial-gradient(circle at 70% 55%, rgba(255,255,255,0.12), transparent 60%);
          opacity: 0.85;
          animation: vtw-fog-float 6.5s ease-in-out infinite;
        }
        @keyframes vtw-fog-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        .vtw-snow {
          position: absolute;
          inset: -30px;
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1.5px),
            radial-gradient(circle, rgba(255,255,255,0.40) 1px, transparent 1.5px);
          background-size: 26px 26px, 34px 34px;
          background-position: 0 0, 10px 10px;
          opacity: 0.35;
          animation: vtw-snow-fall 5.2s linear infinite;
        }
        @keyframes vtw-snow-fall {
          from { background-position: 0 0, 10px 10px; }
          to { background-position: 0 140px, 10px 170px; }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default AppSidebar;

