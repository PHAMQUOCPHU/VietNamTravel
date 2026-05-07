import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import {
  Save,
  X,
  Calendar,
  MapPin,
  Tag,
  Layers,
  Navigation,
  FileText,
  Zap,
  UploadCloud,
  Plus,
} from "lucide-react";
import {
  TOUR_CATEGORY_VALUES,
  TOUR_CATEGORY_LABELS,
  normalizeTourCategory,
} from "../constants/tourCategories.js";
import {
  formatDepartureSlotLabel,
  buildManualDepartureSlot,
  normalizeManualDepartureSlotsForSave,
} from "../utils/departureSchedule.js";

const EditTour = () => {
  const { tourKey } = useParams();
  const navigate = useNavigate();
  const { backendUrl, aToken } = useContext(AdminContext);
  const normalizedBackendUrl = backendUrl.trim().replace(/\/+$/, "");

  const [loading, setLoading] = useState(true);
  const [newImages, setNewImages] = useState([null, null, null]);
  const [newImagePreviews, setNewImagePreviews] = useState([null, null, null]);
  const [oldImages, setOldImages] = useState(["", "", ""]);

  // Cleanup image preview URLs to prevent memory leak
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [newImagePreviews]);

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [maxGroupSize, setMaxGroupSize] = useState(10);
  const [duration, setDuration] = useState(1);
  const [desc, setDesc] = useState("");
  const [itinerary, setItinerary] = useState([
    { dayTitle: "Ngày 1 - ", content: "" },
  ]);
  const [featured, setFeatured] = useState(false);
  const [category, setCategory] = useState(TOUR_CATEGORY_VALUES[0]);
  const [region, setRegion] = useState("Bắc");

  // Logic Lịch trình (Đồng bộ AddTour)
  const [bookingMode, setBookingMode] = useState("manual");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("07:00");
  const [availableDates, setAvailableDates] = useState([]);
  const [autoSchedule, setAutoSchedule] = useState({
    startDate: "",
    endDate: "",
    departureTime: "07:00",
  });
  const [selectedDays, setSelectedDays] = useState([]);

  const daysOfWeek = [
    { label: "T2", value: 1 },
    { label: "T3", value: 2 },
    { label: "T4", value: 3 },
    { label: "T5", value: 4 },
    { label: "T6", value: 5 },
    { label: "T7", value: 6 },
    { label: "CN", value: 0 },
  ];

  const formatCurrency = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const handlePriceChange = (value, setter) => {
    const rawValue = value.replace(/\D/g, "");
    setter(rawValue);
  };

  const handleDayToggle = (dayValue) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue],
    );
  };

  const selectAllDays = () => {
    selectedDays.length === 7
      ? setSelectedDays([])
      : setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
  };

  useEffect(() => {
    const fetchTour = async () => {
      if (!tourKey || !aToken) return;
      try {
        const { data } = await axios.get(
          `${normalizedBackendUrl}/api/tour/single/${tourKey}`,
        );
        if (data.success && data.tour) {
          const tour = data.tour;
          if (tour.slug && tourKey !== tour.slug) {
            navigate(`/admin/edit-tour/${tour.slug}`, { replace: true });
          }
          setTitle(tour.title || "");
          setCity(tour.city || "");
          setPrice(String(tour.price || ""));
          setOldPrice(String(tour.oldPrice || ""));
          setMaxGroupSize(tour.maxGroupSize || 10);
          setDuration(tour.duration || 1);
          setDesc(tour.desc || "");
          setItinerary(
            Array.isArray(tour.itinerary) && tour.itinerary.length > 0
              ? tour.itinerary
              : [{ dayTitle: "Ngày 1 - ", content: "" }],
          );
          setFeatured(tour.featured || false);
          setCategory(normalizeTourCategory(tour.category));
          setRegion(tour.region || "Bắc");
          const loadedImages = Array.isArray(tour.images)
            ? tour.images.filter(Boolean).slice(0, 3)
            : tour.image
              ? [tour.image]
              : [];
          while (loadedImages.length < 3) {
            loadedImages.push(loadedImages[loadedImages.length - 1] || "");
          }
          setOldImages(loadedImages);
          setBookingMode(tour.bookingMode || "manual");
          setAvailableDates(
            Array.isArray(tour.availableDates) ? tour.availableDates : [],
          );
          if (tour.autoSchedule) {
            setAutoSchedule({
              startDate: tour.autoSchedule.startDate || "",
              endDate: tour.autoSchedule.endDate || "",
              departureTime: tour.autoSchedule.departureTime || "07:00",
            });
            setSelectedDays(tour.autoSchedule.selectedDays || []);
          }
        }
      } catch {
        toast.error("Lỗi lấy dữ liệu!");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourKey, normalizedBackendUrl, aToken, navigate]);

  const addDate = () => {
    const slot = buildManualDepartureSlot(dateInput, timeInput);
    if (slot && !availableDates.includes(slot)) {
      setAvailableDates([...availableDates, slot]);
      setDateInput("");
    }
  };

  const hasAnyNewImage = newImages.some(Boolean);
  const canSubmitImageUpdate = !hasAnyNewImage || newImages.every(Boolean);

  const handleImageChange = (index, file) => {
    if (!file) return;
    setNewImages((prev) =>
      prev.map((item, idx) => (idx === index ? file : item)),
    );
    setNewImagePreviews((prev) => {
      const newPreviews = [...prev];
      if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
      newPreviews[index] = URL.createObjectURL(file);
      return newPreviews;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitImageUpdate) {
      toast.error("Nếu muốn đổi ảnh, bạn cần tải đủ 3 ảnh mới.");
      return;
    }
    const toastId = toast.loading("Đang lưu thay đổi...");
    try {
      const updateForm = new FormData();
      updateForm.append("title", title);
      updateForm.append("city", city);
      updateForm.append("price", Number(price));
      updateForm.append("oldPrice", Number(oldPrice) || 0);
      updateForm.append("maxGroupSize", Number(maxGroupSize));
      updateForm.append("duration", Number(duration));
      updateForm.append("desc", desc);
      updateForm.append("itinerary", JSON.stringify(itinerary));
      updateForm.append("featured", featured);
      updateForm.append("category", category);
      updateForm.append("region", region);
      updateForm.append("bookingMode", bookingMode);

      if (bookingMode === "manual") {
        const slotsForApi = normalizeManualDepartureSlotsForSave(
          availableDates,
          timeInput,
        );
        updateForm.append("availableDates", JSON.stringify(slotsForApi));
      } else {
        updateForm.append(
          "autoSchedule",
          JSON.stringify({ ...autoSchedule, selectedDays }),
        );
      }

      if (hasAnyNewImage) {
        newImages.forEach((file) => updateForm.append("images", file));
      }

      const { data } = await axios.post(
        `${normalizedBackendUrl}/api/tour/update/${tourKey}`,
        updateForm,
        {
          headers: { token: aToken },
          timeout: 120_000,
        },
      );

      if (data.success) {
        toast.update(toastId, {
          render: "Cập nhật thành công!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
        setTimeout(() => navigate("/admin/tours"), 1000);
      } else {
        toast.update(toastId, {
          render: data.message || "Cập nhật thất bại",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "Hết thời gian chờ máy chủ (upload ảnh có thể lâu). Thử lại."
          : err.message) ||
        "Lỗi kết nối hoặc máy chủ từ chối.";
      toast.update(toastId, {
        render: msg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const updateItineraryItem = (index, key, value) => {
    setItinerary((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const addItineraryDay = () => {
    const next = itinerary.length + 1;
    setItinerary((prev) => [
      ...prev,
      { dayTitle: `Ngày ${next} - `, content: "" },
    ]);
  };

  const removeItineraryDay = (index) => {
    if (itinerary.length === 1) return;
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading)
    return (
      <div className="p-20 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="font-bold text-slate-500 uppercase tracking-widest">
          Đang tải dữ liệu tour...
        </p>
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="m-6 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 pb-12"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Plus
              className="bg-blue-600 text-white rounded-xl p-1.5"
              size={35}
            />
            Chỉnh sửa Tour
          </h2>
          <p className="text-slate-500 font-medium ml-12 italic">
            Đang hiệu chỉnh:{" "}
            <span className="text-blue-600 font-bold">{title}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/tours")}
          className="p-2 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <X size={28} />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Tag size={18} className="text-blue-500" /> Hình ảnh Tour
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => {
                const previewSrc = newImagePreviews[index]
                  ? newImagePreviews[index]
                  : oldImages[index]
                    ? oldImages[index].startsWith("http")
                      ? oldImages[index]
                      : "https://via.placeholder.com/300x220?text=No+Image"
                    : "https://via.placeholder.com/300x220?text=No+Image";

                return (
                  <label
                    key={`tour-image-${index}`}
                    htmlFor={`tour-image-${index}`}
                    className="group cursor-pointer block relative"
                  >
                    <div className="relative">
                      <img
                        className="w-full h-28 object-cover rounded-2xl shadow-md border border-slate-100"
                        src={previewSrc}
                        alt={`Tour ${index + 1}`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center text-white">
                          <UploadCloud size={18} />
                          <span className="text-[10px] font-black mt-1">
                            Ảnh {index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      id={`tour-image-${index}`}
                      hidden
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(index, e.target.files?.[0])
                      }
                    />
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              Có thể giữ ảnh cũ. Nếu đổi ảnh thì tải đủ 3 ảnh mới.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-5">
            <p className="font-bold text-slate-700 flex items-center gap-2 border-b pb-3 border-slate-50">
              <Zap size={18} className="text-amber-500" /> Phân loại nhanh
            </p>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block ml-1">
                Loại hình
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-100 bg-slate-50 font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              >
                {TOUR_CATEGORY_VALUES.map((opt) => (
                  <option key={opt} value={opt}>
                    {TOUR_CATEGORY_LABELS[opt] || opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block ml-1">
                Vùng miền
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-100 bg-slate-50 font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              >
                {["Bắc", "Trung", "Nam"].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Navigation size={16} className="text-blue-500" /> Tên Tour
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 bg-slate-50 transition-all font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <MapPin size={16} className="text-red-500" /> Thành phố
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 bg-slate-50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Giá bán (đ)
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(price)}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setPrice)
                    }
                    className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 font-black text-blue-600 outline-none focus:border-blue-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Giá gốc (đ)
                  </label>
                  <input
                    type="text"
                    value={formatCurrency(oldPrice)}
                    onChange={(e) =>
                      handlePriceChange(e.target.value, setOldPrice)
                    }
                    className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 text-slate-400 line-through outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Số người
                  </label>
                  <input
                    type="number"
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(e.target.value)}
                    className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 font-bold outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:w-1/2">
                <label className="text-[10px] font-black text-slate-400 uppercase block ml-1">
                  Thời gian diễn ra (ngày)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 font-black text-slate-700 outline-none focus:border-blue-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* Lịch khởi hành (Đã khôi phục Auto Mode) */}
            <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-100 mb-8">
              <div className="flex items-center justify-between mb-6">
                <label className="font-black text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                  <Calendar className="text-blue-600" size={18} /> Lịch khởi
                  hành
                </label>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBookingMode("manual")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${bookingMode === "manual" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Thủ công
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode("auto")}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${bookingMode === "auto" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Tự động
                  </button>
                </div>
              </div>

              {bookingMode === "manual" ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="flex-1 border-2 border-white rounded-2xl p-3 shadow-sm outline-none"
                    />
                    <input
                      type="time"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      title="Giờ khởi hành"
                      className="w-full sm:w-36 border-2 border-white rounded-2xl p-3 shadow-sm outline-none font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={addDate}
                      className="bg-blue-600 text-white px-8 rounded-2xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
                    >
                      + Thêm
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Khi bấm Lưu, giờ trong ô bên trên áp dụng cho tất cả các
                    ngày đã thêm (cùng một giờ khởi hành).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map((slot) => (
                      <span
                        key={slot}
                        className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-50 shadow-sm flex items-center gap-2"
                      >
                        {formatDepartureSlotLabel(slot)}{" "}
                        <X
                          onClick={() =>
                            setAvailableDates(
                              availableDates.filter((d) => d !== slot),
                            )
                          }
                          className="cursor-pointer text-slate-300 hover:text-red-500"
                          size={14}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-1">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={autoSchedule.startDate}
                        onChange={(e) =>
                          setAutoSchedule({
                            ...autoSchedule,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full p-4 rounded-2xl border-2 border-white shadow-sm font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={autoSchedule.endDate}
                        onChange={(e) =>
                          setAutoSchedule({
                            ...autoSchedule,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full p-4 rounded-2xl border-2 border-white shadow-sm font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                        Giờ khởi hành (áp dụng mọi ngày đã chọn)
                      </label>
                      <input
                        type="time"
                        value={autoSchedule.departureTime || "07:00"}
                        onChange={(e) =>
                          setAutoSchedule({
                            ...autoSchedule,
                            departureTime: e.target.value,
                          })
                        }
                        className="w-full max-w-xs p-4 rounded-2xl border-2 border-white shadow-sm font-mono outline-none"
                      />
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Lặp lại vào thứ:
                      </label>
                      <button
                        type="button"
                        onClick={selectAllDays}
                        className="text-[10px] font-bold text-blue-600 px-3 py-1.5 rounded-lg"
                      >
                        Chọn tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayToggle(day.value)}
                          className={`py-4 rounded-xl font-black text-xs transition-all border-2 ${selectedDays.includes(day.value) ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-400 border-slate-50"}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> Mô tả chi tiết
                tour
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows="5"
                className="w-full border-2 border-slate-50 rounded-3xl p-5 outline-none focus:border-blue-400 bg-slate-50 transition-all resize-none leading-relaxed"
                required
              />
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Lịch trình theo từng ngày
                </label>
                <button
                  type="button"
                  onClick={addItineraryDay}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                >
                  + Thêm ngày
                </button>
              </div>
              <div className="space-y-3">
                {itinerary.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        value={item.dayTitle}
                        onChange={(e) =>
                          updateItineraryItem(index, "dayTitle", e.target.value)
                        }
                        placeholder={`Ngày ${index + 1} - ...`}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeItineraryDay(index)}
                        className="px-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500"
                        title="Xóa ngày"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={item.content}
                      onChange={(e) =>
                        updateItineraryItem(index, "content", e.target.value)
                      }
                      placeholder="Mô tả chi tiết hoạt động trong ngày..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-10 pt-8 border-t border-slate-50">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div
                  className={`w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${featured ? "bg-blue-600" : "bg-slate-200"}`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-lg transition-all duration-300 transform ${featured ? "translate-x-7" : "translate-x-0"}`}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={() => setFeatured(!featured)}
                  className="hidden"
                />
                <span className="font-bold text-slate-700">
                  Đánh dấu Tour nổi bật
                </span>
              </label>

              <button
                type="submit"
                disabled={!canSubmitImageUpdate}
                className={`group w-full md:w-auto px-12 py-5 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 ${
                  canSubmitImageUpdate
                    ? "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-slate-100"
                }`}
              >
                XÁC NHẬN CẬP NHẬT{" "}
                <Plus
                  size={20}
                  className="group-hover:rotate-90 transition-all"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EditTour;
