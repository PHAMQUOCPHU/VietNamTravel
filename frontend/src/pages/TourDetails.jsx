import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  MapPin,
  ThermometerSun,
  AlertCircle,
  Clock,
  Star,
  MessageSquareText,
} from "lucide-react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import TourMap from "../components/TourMap";
import TourCardStackGallery from "../components/TourCardStackGallery";
import { buildTourSlug, isMongoObjectId } from "../lib/tourSlug";
import {
  getBookings,
  getReviewStats,
  getSchedulesByTour,
  getTourById,
} from "../services";
import {
  TOUR_AMENITIES,
  TOUR_EXCLUSIONS,
  TOUR_INCLUSIONS,
} from "./tour-details/constants";
import {
  CITY_COORD_FALLBACK,
  WEATHER_CITY_QUERY_MAP,
  getTravelAdvice,
  getWeatherIcon,
  normWeatherCityKey,
  pickGeoResult,
} from "./tour-details/weatherUtils";

const TourDetails = () => {
  const { user, tours, backendUrl, reviewRefreshTick } = useContext(AppContext);
  const navigate = useNavigate();
  const { slug: slugParam } = useParams();
  const tour = useMemo(
    () =>
      tours.find(
        (item) =>
          buildTourSlug(item) === slugParam || item._id === slugParam,
      ),
    [tours, slugParam],
  );
  const tourKey = useMemo(
    () => (isMongoObjectId(slugParam) ? slugParam : slugParam || ""),
    [slugParam],
  );

  // --- 1. STATES ---
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [weather, setWeather] = useState(null);
  const [, setLoadingWeather] = useState(false);
  const [activeWeatherIdx, setActiveWeatherIdx] = useState(0);
  const [coords, setCoords] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [latestReviews, setLatestReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [activeItineraryIndex, setActiveItineraryIndex] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateBooking, setDuplicateBooking] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // --- 2. FETCH LỊCH TRÌNH (FIX PORT 5001 & URL) ---
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoadingSchedules(true);
        // Đảm bảo không bị thừa dấu / và dùng đúng port 5001 nếu backendUrl đã cấu hình
        const base = backendUrl.trim().replace(/\/+$/, "");

        // Gọi API lấy lịch trình
        const target = tour?._id || tourKey;
        const data = await getSchedulesByTour({ backendUrl: base, tourId: target });

        if (data.success) {
          setSchedules(data.schedules);
          // Tự động chọn ngày đầu tiên nếu có
          if (data.schedules.length > 0) {
            setSelectedSchedule(data.schedules[0]);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy lịch trình:", error);
      } finally {
        setLoadingSchedules(false);
      }
    };
    if (tour?._id || tourKey) fetchSchedules();
  }, [tour?._id, tourKey, backendUrl, reviewRefreshTick]);

  useEffect(() => {
    if (showAllReviews) {
      setReviewPage(1);
    }
  }, [showAllReviews]);

  // --- 3. FETCH THỜI TIẾT ---
  useEffect(() => {
    const fetchWeather = async () => {
      if (!tour?.city) return;
      try {
        setLoadingWeather(true);
        const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
        if (!API_KEY) return;

        const city = String(tour.city || "").trim();
        const cityNorm = normWeatherCityKey(city);
        const mappedCandidates = WEATHER_CITY_QUERY_MAP[cityNorm] || [];
        const candidates = Array.from(
          new Set([
            ...mappedCandidates,
            `${city}, VN`,
            city,
          ]),
        ).filter(Boolean);

        let foundCoord = null;
        for (const q of candidates) {
          const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`;
          const geoRes = await axios.get(geoUrl);
          const picked = pickGeoResult(geoRes.data);
          if (picked) {
            foundCoord = picked;
            break;
          }
        }

        const fallback = CITY_COORD_FALLBACK[cityNorm];
        if (!foundCoord && fallback) {
          foundCoord = { lat: fallback.lat, lon: fallback.lon, country: "VN" };
        }
        if (!foundCoord) return;

        const { lat, lon } = foundCoord;
        setCoords({ lat, lon });
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=vi&appid=${API_KEY}`;
        const weatherRes = await axios.get(weatherUrl);
        setWeather(weatherRes.data);
      } catch (error) {
        console.error("Weather API Error:", error);
      } finally {
        setLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [tour?.city]);

  useEffect(() => {
    const fetchReviewStats = async () => {
      const target = tour?._id || tourKey;
      if (!target) return;
      try {
        const data = await getReviewStats({ backendUrl, target });
        if (data.success) {
          setReviewStats(data.stats);
          setLatestReviews(data.latestReviews || []);
          setAllReviews(data.reviews || []);
        }
      } catch {
        console.log("Lỗi tải thống kê review");
      }
    };
    fetchReviewStats();
  }, [tour?._id, tourKey, backendUrl]);

  useEffect(() => {
    if (!tour) return;
    const canonical = buildTourSlug(tour);
    if (slugParam !== canonical) {
      navigate(`/tours/${canonical}`, { replace: true });
    }
  }, [tour, slugParam, navigate]);

  useEffect(() => {
    const redirectLegacyIdToSlug = async () => {
      if (!isMongoObjectId(slugParam)) return;
      try {
        const data = await getTourById({ backendUrl, tourId: slugParam });
        const canonical = buildTourSlug(data?.tour);
        if (data?.success && canonical && canonical !== slugParam) {
          navigate(`/tours/${canonical}`, { replace: true });
        }
      } catch {
        // Giữ yên URL hiện tại nếu API lỗi.
      }
    };
    redirectLegacyIdToSlug();
  }, [slugParam, backendUrl, navigate]);

  const dailyForecasts =
    weather?.list.filter((item) => item.dt_txt.includes("12:00:00")) || [];
  const advice = getTravelAdvice({
    selectedItem: dailyForecasts[activeWeatherIdx],
    city: tour?.city,
  });
  const AdviceIcon = advice?.icon?.Icon;

  if (!tour)
    return (
      <div className="text-center py-24 italic">Đang tải dữ liệu tour...</div>
    );

  const { image, images, title, desc, price, city } = tour;
  const priceAdult = Number(tour.salePrice ?? price) || 0;
  /** Trẻ em: giảm 40% → thanh toán 60% giá người lớn (đồng bộ Booking) */
  const CHILD_PRICE_FACTOR = 0.6;
  const priceChild = Math.round(priceAdult * CHILD_PRICE_FACTOR);
  const lineAdults = adults * priceAdult;
  const lineChildren = children * priceChild;
  const totalAmount = lineAdults + lineChildren;

  const remainingSlots = selectedSchedule
    ? selectedSchedule.maxGroupSize - selectedSchedule.joinedParticipants
    : 0;
  const isFull = adults + children > remainingSlots;

  const galleryImages =
    Array.isArray(images) && images.length > 0 ? images : image ? [image] : [];

  const reviewsPerPage = 5;
  const totalReviewPages = Math.max(1, Math.ceil(allReviews.length / reviewsPerPage));
  const pagedReviews = allReviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage,
  );

  const proceedToBooking = () => {
    navigate("/booking", {
      state: {
        tour,
        scheduleId: selectedSchedule._id,
        selectedDate: {
          _id: selectedSchedule._id,
          date: selectedSchedule.startDate, // Truyền trực tiếp từ schedule
        },
        guestSize: { adult: adults, children: children },
        totalPrice: totalAmount,
      },
    });
  };

  const checkDuplicatePendingBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const data = await getBookings({ backendUrl, token });
    if (!data?.success || !Array.isArray(data.bookings)) return null;
    return (
      data.bookings.find(
        (b) =>
          b?.status?.toLowerCase() === "pending" &&
          String(b?.tourId?._id || b?.tourId) === String(tour?._id),
      ) || null
    );
  };

  // --- 4. XỬ LÝ ĐẶT TOUR ---
  const handleBookingClick = async () => {
    if (!selectedSchedule) {
      toast.warning("Vui lòng chọn một ngày khởi hành!");
      return;
    }
    if (isFull) {
      toast.error("Rất tiếc, ngày này không đủ chỗ!");
      return;
    }
    if (!user) {
      toast.info("Vui lòng đăng nhập để đặt tour!");
      navigate("/login");
      return;
    }

    try {
      setCheckingDuplicate(true);
      const duplicated = await checkDuplicatePendingBooking();
      if (duplicated) {
        setDuplicateBooking(duplicated);
        setShowDuplicateModal(true);
        return;
      }
      proceedToBooking();
    } catch {
      toast.error("Không thể kiểm tra đơn cũ. Vui lòng thử lại.");
    } finally {
      setCheckingDuplicate(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] py-10 px-4 sm:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Banner */}
        <div className="relative">
          <TourCardStackGallery
            images={galleryImages}
            title={title}
            backendUrl={backendUrl}
          />
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white pr-24 md:pr-40">
            <h1 className="text-4xl md:text-6xl font-black mb-4 uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
              {title}
            </h1>
            <span className="flex items-center gap-2 bg-black/35 backdrop-blur-sm px-4 py-2 rounded-full border border-white/35 w-fit shadow-lg">
              <MapPin size={20} className="text-orange-400" /> {city}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-8 space-y-8">
            {/* Giới thiệu */}
            <div className="text-lg text-slate-600 leading-relaxed bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative">
              <div className="absolute top-0 left-10 -translate-y-1/2 bg-[#1e3a8a] text-white px-6 py-1 rounded-full text-xs font-bold uppercase">
                Giới thiệu tour
              </div>
              {desc}
            </div>

            {/* Tiện ích */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="text-2xl font-black text-slate-800 mb-6">Tiện ích</h3>
              <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-y-0 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden">
                {TOUR_AMENITIES.map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-1 flex-col items-center justify-center gap-3 py-8 px-4 text-slate-500"
                  >
                    <Icon className="h-10 w-10 shrink-0" strokeWidth={1.35} aria-hidden />
                    <span className="text-center text-sm font-semibold text-slate-600">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bao gồm / Không bao gồm */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm ring-1 ring-emerald-500/10">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-500" />
                <div className="pl-2">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-800">
                    <span className="text-lg leading-none" aria-hidden>
                      ✅
                    </span>
                    Bao gồm
                  </h3>
                  <ul className="space-y-2.5">
                    {TOUR_INCLUSIONS.map(({ Icon, text }) => (
                      <li
                        key={text}
                        className="flex gap-3 rounded-xl border border-emerald-50/80 bg-emerald-50/35 px-3 py-2.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </span>
                        <span className="text-sm font-medium leading-snug text-slate-700">
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm ring-1 ring-rose-500/10">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 via-rose-500 to-orange-400" />
                <div className="pl-2">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-800">
                    <span className="text-lg leading-none" aria-hidden>
                      ❌
                    </span>
                    Không bao gồm
                  </h3>
                  <ul className="space-y-2.5">
                    {TOUR_EXCLUSIONS.map(({ Icon, text }) => (
                      <li
                        key={text}
                        className="flex gap-3 rounded-xl border border-rose-50/90 bg-rose-50/40 px-3 py-2.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-500 shadow-sm ring-1 ring-rose-100">
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </span>
                        <span className="text-sm font-medium leading-snug text-slate-700">
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Lịch trình theo từng ngày */}
            {Array.isArray(tour.itinerary) && tour.itinerary.length > 0 && (
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="text-2xl font-black text-slate-800 mb-6">
                  Lịch trình
                </h3>
                <div className="space-y-3">
                  {tour.itinerary.map((item, index) => {
                    const isActive = activeItineraryIndex === index;
                    return (
                      <div
                        key={`${item.dayTitle}-${index}`}
                        className="rounded-2xl border border-slate-200 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setActiveItineraryIndex((prev) =>
                              prev === index ? -1 : index,
                            )
                          }
                          className={`w-full flex items-center justify-between px-4 py-3 font-bold text-left ${
                            isActive
                              ? "bg-green-50 text-slate-800"
                              : "bg-white text-slate-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-black inline-flex items-center justify-center">
                              ✓
                            </span>
                            {item.dayTitle}
                          </span>
                          <span className="text-slate-400">{isActive ? "−" : "+"}</span>
                        </button>
                        {isActive && (
                          <div className="px-4 py-4 bg-white text-sm text-slate-600 leading-7 whitespace-pre-line">
                            {item.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weather */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
                <ThermometerSun className="text-orange-500" /> Trợ lý thời tiết
              </h3>
              {weather && advice ? (
                <div className="space-y-8">
                  <div
                    className={`flex items-start gap-4 p-6 rounded-[2rem] border ${advice.color}`}
                  >
                    {AdviceIcon ? (
                      <AdviceIcon className={advice.icon.className} />
                    ) : (
                      <AlertCircle className="text-amber-500" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm uppercase">
                        {advice.status}
                      </h4>
                      <p className="text-sm">{advice.desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {dailyForecasts.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveWeatherIdx(idx)}
                        className={`flex flex-col items-center p-4 rounded-[1.5rem] border cursor-pointer transition-all ${activeWeatherIdx === idx ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 hover:bg-slate-100"}`}
                      >
                        <span className="text-[10px] uppercase font-bold">
                          {new Date(item.dt * 1000).toLocaleDateString(
                            "vi-VN",
                            { weekday: "short" },
                          )}
                        </span>
                        {(() => {
                          const { Icon, className } = getWeatherIcon(item.weather[0].main);
                          return <Icon className={className} size={28} />;
                        })()}
                        <span className="text-xl font-black mt-2">
                          {Math.round(item.main.temp)}°
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic text-sm text-center">
                  Đang cập nhật thời tiết từ OpenWeather...
                </p>
              )}
            </div>

            <TourMap coords={coords} title={title} />

            {/* Lịch khởi hành - PHẦN QUAN TRỌNG NHẤT */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <label className="font-black text-[#1e3a8a] mb-6 flex items-center gap-2 uppercase text-sm">
                <Calendar className="text-orange-500" size={20} /> Lịch khởi
                hành có sẵn
              </label>

              {loadingSchedules ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-slate-400 text-sm">
                    Đang tải lịch trình...
                  </p>
                </div>
              ) : schedules && schedules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schedules.map((sch) => {
                    const remains = sch.maxGroupSize - sch.joinedParticipants;
                    const isSelected = selectedSchedule?._id === sch._id;
                    return (
                      <div
                        key={sch._id}
                        onClick={() => setSelectedSchedule(sch)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all ${isSelected ? "border-blue-600 bg-blue-50 shadow-md scale-[1.02]" : "border-slate-100 bg-white hover:border-blue-200"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
                          >
                            <Clock size={20} />
                          </div>
                          <div>
                            <p
                              className={`font-bold ${isSelected ? "text-blue-900" : "text-slate-700"}`}
                            >
                              {new Date(sch.startDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 italic">
                              Khởi hành:{" "}
                              {new Date(sch.startDate).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Asia/Ho_Chi_Minh",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-bold ${remains <= 5 ? "text-red-500" : "text-emerald-500"}`}
                          >
                            Còn {remains} chỗ
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <AlertCircle
                    className="mx-auto text-slate-300 mb-2"
                    size={40}
                  />
                  <p className="text-slate-500 font-bold">
                    Chưa có lịch khởi hành cho tour này.
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Vui lòng quay lại sau hoặc liên hệ Admin.
                  </p>
                </div>
              )}
            </div>

            {/* Guest Select */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1e3a8a]">Người lớn</p>
                  <p className="text-xs text-slate-400">Trên 12 tuổi</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-10 h-10 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-black w-6 text-center">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-10 h-10 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1e3a8a]">Trẻ em</p>
                  <p className="text-xs text-slate-400">
                    Dưới 12 tuổi (Giảm 40%)
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-10 h-10 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-black w-6 text-center">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren(children + 1)}
                    className="w-10 h-10 bg-white rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-[#1e3a8a]">
                  Tạm tính
                </p>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between gap-4">
                    <span>
                      Người lớn × {adults}
                      <span className="text-slate-400 font-normal">
                        {" "}
                        ({priceAdult.toLocaleString("vi-VN")} đ / người)
                      </span>
                    </span>
                    <span className="font-semibold text-slate-800 tabular-nums shrink-0">
                      {lineAdults.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                  {children > 0 ? (
                    <div className="flex justify-between gap-4">
                      <span>
                        Trẻ em × {children}
                        <span className="text-slate-400 font-normal">
                          {" "}
                          (Giảm 40% · {priceChild.toLocaleString("vi-VN")} đ / em)
                        </span>
                      </span>
                      <span className="font-semibold text-slate-800 tabular-nums shrink-0">
                        {lineChildren.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Thêm trẻ em để xem dòng giá trẻ em (giảm 40%).
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-baseline gap-4 pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-800">Tổng tạm tính</span>
                  <span className="text-xl font-black text-[#1e3a8a] tabular-nums">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBookingClick}
              disabled={!selectedSchedule || isFull || checkingDuplicate}
              className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all shadow-xl uppercase ${!selectedSchedule || isFull || checkingDuplicate ? "bg-slate-200 cursor-not-allowed text-slate-400" : "bg-[#1e3a8a] text-white hover:bg-[#2563eb] hover:-translate-y-1 active:scale-95"}`}
            >
              {checkingDuplicate
                ? "Đang kiểm tra đơn cũ..."
                : !selectedSchedule
                ? "Vui lòng chọn ngày"
                : isFull
                  ? "Ngày này đã đủ người"
                  : "Xác nhận đặt tour"}
            </button>
          </div>

          <div className="md:col-span-4">
            <div className="sticky top-10 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[#1e3a8a] flex items-center gap-2">
                    <MessageSquareText size={18} className="text-blue-500" />
                    Đánh giá từ khách hàng
                  </h3>
                  <div className="text-amber-500 flex items-center gap-1 font-bold">
                    <Star size={16} className="fill-amber-400" />
                    {reviewStats?.averageRating || 0}/5
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-1 mb-4">
                  {reviewStats?.totalReviews || 0} lượt đánh giá
                </p>

                <div className="space-y-3">
                  {[
                    { key: "guide", label: "Hướng dẫn viên" },
                    { key: "transport", label: "Phương tiện" },
                    { key: "food", label: "Ăn uống" },
                    { key: "schedule", label: "Lịch trình" },
                  ].map((item) => {
                    const percent = reviewStats?.survey?.[item.key]?.satisfiedPercent || 0;
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-[12px] font-semibold text-slate-600 mb-1">
                          <span>{item.label}</span>
                          <span>{percent}% Hài lòng</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">
                    Bình luận mới nhất
                  </h4>
                  <div className="space-y-3">
                    {latestReviews.length > 0 ? (
                      latestReviews.map((review) => (
                        <div
                          key={review._id}
                          className="rounded-xl bg-slate-50 border border-slate-100 p-3"
                        >
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-bold text-slate-700">{review.userName}</p>
                            <span className="text-xs text-amber-500 font-bold">
                              {review.rating}★
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {review.comment || "Khách hàng hài lòng với chuyến đi."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Chưa có đánh giá nào.</p>
                    )}
                  </div>
                  {allReviews.length > 0 && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAllReviews && (
        <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800">
                Tất cả đánh giá khách hàng
              </h3>
              <button
                onClick={() => setShowAllReviews(false)}
                className="text-sm font-bold text-slate-500 hover:text-slate-700"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
              {pagedReviews.map((review) => (
                <div
                  key={review._id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-slate-700">{review.userName}</p>
                    <span className="text-sm font-bold text-amber-500">{review.rating}★</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {review.comment || "Khách hàng đánh giá tích cực về tour này."}
                  </p>
                </div>
              ))}
              {allReviews.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Chưa có đánh giá nào cho tour này.
                </p>
              )}
              {allReviews.length > reviewsPerPage && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
                    disabled={reviewPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-slate-500 font-semibold">
                    Trang {reviewPage}/{totalReviewPages}
                  </span>
                  <button
                    onClick={() =>
                      setReviewPage((prev) => Math.min(totalReviewPages, prev + 1))
                    }
                    disabled={reviewPage === totalReviewPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && duplicateBooking && (
        <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
            <h3 className="text-2xl font-black text-slate-800 mb-3">
              Bạn đã đặt tour này rồi!
            </h3>
            <div className="space-y-2 text-slate-600">
              <p className="font-semibold text-blue-700">
                Ơ kìa! Hình như bạn đã lên lịch cho chuyến đi này rồi.
              </p>
              <p>
                Chúng tôi thấy bạn đã có một đơn giữ chỗ cho tour{" "}
                <span className="font-bold">{tour?.title}</span>. Hãy kiểm tra lại
                để tránh đặt trùng nhé!
              </p>
              <p>
                Ngày khởi hành của đơn cũ:{" "}
                <span className="font-bold text-blue-700">
                  {new Date(duplicateBooking.bookAt).toLocaleDateString("vi-VN")}
                </span>
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/my-booking")}
                className="flex-1 rounded-xl border-2 border-blue-600 bg-white text-blue-600 font-bold py-3 hover:bg-blue-50 transition-colors"
              >
                Kiểm tra đơn cũ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateBooking(null);
                  proceedToBooking();
                }}
                className="flex-1 rounded-xl bg-blue-600 text-white font-bold py-3 hover:bg-blue-700 transition-colors"
              >
                Vẫn muốn đặt tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetails;
