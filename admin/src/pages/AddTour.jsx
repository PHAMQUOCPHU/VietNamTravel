import React, { useState, useContext, useEffect } from "react";
import { AdminContext } from "../context/AdminContext";
import { toast } from "react-toastify";
import { addTourApi } from "../api/tourApi";
import {
  UploadCloud,
  Plus,
  Calendar,
  MapPin,
  Tag,
  Zap,
  Navigation,
  X,
} from "lucide-react";
import {
  TOUR_CATEGORY_VALUES,
  TOUR_CATEGORY_LABELS,
} from "../constants/tourCategories.js";
import {
  formatDepartureSlotLabel,
  buildManualDepartureSlot,
  normalizeManualDepartureSlotsForSave,
} from "../utils/departureSchedule.js";

const AddTour = () => {
  const { aToken, backendUrl } = useContext(AdminContext);

  const [images, setImages] = useState([null, null, null]);
  const [imagePreviews, setImagePreviews] = useState([null, null, null]);
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

  const [bookingMode, setBookingMode] = useState("manual");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("07:00");
  const [availableDates, setAvailableDates] = useState([]);

  // Cleanup image preview URLs to prevent memory leak
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

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

  const addDate = () => {
    const slot = buildManualDepartureSlot(dateInput, timeInput);
    if (slot && !availableDates.includes(slot)) {
      setAvailableDates([...availableDates, slot]);
      setDateInput("");
    }
  };

  const hasEnoughImages = images.every(Boolean);

  const handleImageChange = (index, file) => {
    if (!file) return;
    setImages((prev) => prev.map((item, idx) => (idx === index ? file : item)));
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
      newPreviews[index] = URL.createObjectURL(file);
      return newPreviews;
    });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Đang xử lý dữ liệu...");
    try {
      if (!hasEnoughImages) {
        toast.update(toastId, {
          render: "Vui lòng tải đủ 3 ảnh cho tour!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      const formData = new FormData();
      images.forEach((file) => formData.append("images", file));
      formData.append("title", title);
      formData.append("city", city);
      formData.append("price", Number(price));
      formData.append("oldPrice", Number(oldPrice) || 0);
      formData.append("maxGroupSize", Number(maxGroupSize));
      formData.append("duration", Number(duration));
      formData.append("desc", desc);
      formData.append("itinerary", JSON.stringify(itinerary));
      formData.append("featured", featured);
      formData.append("category", category);
      formData.append("region", region);
      formData.append("bookingMode", bookingMode);

      if (bookingMode === "manual") {
        formData.append(
          "availableDates",
          JSON.stringify(
            normalizeManualDepartureSlotsForSave(availableDates, timeInput),
          ),
        );
      } else {
        formData.append(
          "autoSchedule",
          JSON.stringify({ ...autoSchedule, selectedDays }),
        );
      }

      const response = await addTourApi(formData, aToken, backendUrl);
      if (response.success) {
        toast.update(toastId, {
          render: "Thêm Tour thành công!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        setImages([null, null, null]);
        setTitle("");
        setCity("");
        setPrice("");
        setOldPrice("");
        setDuration(1);
        setDesc("");
        setItinerary([{ dayTitle: "Ngày 1 - ", content: "" }]);
        setCategory(TOUR_CATEGORY_VALUES[0]);
        setAvailableDates([]);
        setSelectedDays([]);
        setTimeInput("07:00");
        setAutoSchedule({ startDate: "", endDate: "", departureTime: "07:00" });
      } else {
        toast.update(toastId, {
          render: response.message,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.update(toastId, {
        render:
          error?.response?.data?.message || error?.message || "Lỗi hệ thống!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
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

  return (
    <form
      onSubmit={onSubmitHandler}
      className="m-6 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500 pb-12"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Plus
              className="bg-blue-600 text-white rounded-xl p-1.5"
              size={35}
            />
            Tạo Tour Mới
          </h2>
          <p className="text-slate-500 font-medium ml-12 italic">
            Thiết lập các thông số cơ bản cho tour du lịch
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Tag size={18} className="text-blue-500" /> Hình ảnh Tour
            </p>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, index) => (
                <label
                  key={`tour-image-${index}`}
                  htmlFor={`tour-image-${index}`}
                  className="group cursor-pointer block relative"
                >
                  {imagePreviews[index] ? (
                    <div className="relative">
                      <img
                        className="w-full h-28 object-cover rounded-2xl shadow-md border border-slate-100"
                        src={imagePreviews[index]}
                        alt={`tour-${index + 1}`}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-all">
                        <span className="text-white font-bold text-[10px] bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                          Đổi ảnh {index + 1}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-28 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                      <UploadCloud size={20} className="text-blue-500 mb-1" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                        Ảnh {index + 1}
                      </span>
                    </div>
                  )}
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
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              Yêu cầu tải đủ 3 ảnh để tạo tour.
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
                  <Navigation size={16} className="text-blue-500" /> Tên Tour du
                  lịch
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tour Đà Lạt 3 ngày 2 đêm"
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 bg-slate-50 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <MapPin size={16} className="text-red-500" /> Thành phố / Địa
                  danh
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="VD: Lâm Đồng"
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 bg-slate-50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Khối thông số - Chia làm 2 hàng để đẹp hơn */}
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
                    Số người tối đa
                  </label>
                  <input
                    type="number"
                    value={maxGroupSize}
                    onChange={(e) => setMaxGroupSize(e.target.value)}
                    className="w-full border-2 border-slate-50 rounded-xl p-3 bg-slate-50 font-bold outline-none focus:border-blue-200"
                    required
                  />
                </div>
              </div>

              {/* Ô THỜI GIAN DIỄN RA - ĐƯA XUỐNG DÒNG RIÊNG */}
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

            {/* Lịch khởi hành */}
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
                      className="flex-1 border-2 border-white rounded-2xl p-3 shadow-sm outline-none focus:border-blue-300"
                    />
                    <input
                      type="time"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      title="Giờ khởi hành"
                      className="w-full sm:w-36 border-2 border-white rounded-2xl p-3 shadow-sm outline-none focus:border-blue-300 font-mono text-sm"
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
                    Khi gửi form, giờ trong ô bên trên áp dụng cho tất cả các
                    ngày đã thêm.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map((slot) => (
                      <span
                        key={slot}
                        className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-50 shadow-sm flex items-center gap-2 animate-in zoom-in"
                      >
                        {formatDepartureSlotLabel(slot)}{" "}
                        <X
                          onClick={() =>
                            setAvailableDates(
                              availableDates.filter((d) => d !== slot),
                            )
                          }
                          className="cursor-pointer text-slate-300 hover:text-red-500 transition-colors"
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
                        className="w-full p-4 rounded-2xl border-2 border-white shadow-sm font-medium outline-none focus:border-blue-200"
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
                        className="w-full p-4 rounded-2xl border-2 border-white shadow-sm font-medium outline-none focus:border-blue-200"
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
                        className="w-full max-w-xs p-4 rounded-2xl border-2 border-white shadow-sm font-mono outline-none focus:border-blue-200"
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
                        className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
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
                          className={`py-4 rounded-xl font-black text-xs transition-all border-2 ${selectedDays.includes(day.value) ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200"}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                Mô tả giới thiệu tour
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows="4"
                placeholder="Giới thiệu ngắn gọn điểm nổi bật của tour..."
                className="w-full border-2 border-slate-50 rounded-3xl p-5 outline-none focus:border-blue-400 bg-slate-50 transition-all resize-none"
                required
              />
            </div>

            <div className="space-y-4 mb-8">
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-50">
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
                <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  Đánh dấu Tour nổi bật
                </span>
              </label>

              <button
                type="submit"
                disabled={!hasEnoughImages}
                className={`group w-full md:w-auto px-12 py-5 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 ${
                  hasEnoughImages
                    ? "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-slate-100"
                }`}
              >
                XÁC NHẬN LƯU TOUR{" "}
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

export default AddTour;
