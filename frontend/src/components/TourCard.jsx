import React, { useContext, useEffect, useState } from "react";
import { Star, MapPin, Heart, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import { buildTourSlug } from "../lib/tourSlug";

const TourCard = ({ tour }) => {
  // Lấy dữ liệu từ tour. Lưu ý: Thử cả duration và time để tránh lệch tên biến từ API
  const { _id, title, image, images, price, oldPrice, featured, city, avgRating } =
    tour;

  // Kiểm tra tên biến thực tế từ Backend (thử cả hai trường hợp)
  const durationValue = tour.duration || tour.time || 0;

  const { backendUrl, user, toggleFavorite } = useContext(AppContext);
  const navigate = useNavigate();

  const coverImage = images?.[0] || image;
  const finalImageUrl =
    typeof coverImage === "string" &&
    !coverImage.includes("data:image") &&
    !coverImage.startsWith("http")
      ? "https://via.placeholder.com/500x350?text=VietNam+Travel"
      : coverImage;

  const isSaleActive = Boolean(tour.isSaleActive);
  const numPrice = Number(price ?? 0);
  const numOldPrice = Number(oldPrice ?? 0);
  const originalPrice = Number(tour.originalPrice ?? price ?? 0);
  const salePrice = Number(tour.salePrice ?? price ?? 0);
  const discount = isSaleActive
    ? Number(tour.discountPercent || 0)
    : numOldPrice > numPrice && numOldPrice > 0
      ? Math.round(((numOldPrice - numPrice) / numOldPrice) * 100)
      : 0;
  const showListStrikethrough =
    !isSaleActive && numOldPrice > numPrice && numOldPrice > 0;
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    if (!isSaleActive || !tour.saleEndDate) {
      setCountdownText("");
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const end = new Date(tour.saleEndDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setCountdownText("Sắp kết thúc");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        setCountdownText(`Còn ${days}N ${hours}G`);
      } else {
        setCountdownText(
          `Còn ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        );
      }
    };

    updateCountdown();
    const end = new Date(tour.saleEndDate).getTime();
    const remaining = end - Date.now();
    // Tránh tạo quá nhiều interval 1s khi có nhiều card cùng lúc.
    const tickMs = remaining > 24 * 60 * 60 * 1000 ? 60 * 1000 : 1000;
    const timer = setInterval(updateCountdown, tickMs);
    return () => clearInterval(timer);
  }, [isSaleActive, tour.saleEndDate]);

  // Hàm hiển thị số ngày đêm
  const renderDuration = (days) => {
    const d = Number(days);
    if (!d || d <= 1) return "Tour trong ngày";
    return `${d} ngày ${d - 1} đêm`;
  };

  const isFavorite = user?.favorites?.some(
    (fav) => (fav._id ? fav._id.toString() : fav.toString()) === _id.toString(),
  );
  const detailPath = `/tours/${buildTourSlug(tour)}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 h-full flex flex-col relative dark:bg-slate-900 dark:border-slate-700"
    >
      <div className="relative">
        <img
          src={finalImageUrl}
          alt={title}
          className="w-full h-52 object-cover"
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/500x350?text=VietNam+Travel";
          }}
        />

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(_id);
          }}
          className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-all group dark:bg-slate-800/90"
        >
          <Heart
            size={20}
            className={`transition-all duration-300 ${
              isFavorite
                ? "fill-red-500 text-red-500 scale-110"
                : "text-gray-400 group-hover:text-red-400"
            }`}
          />
        </button>

        {featured && (
          <span
            className={`absolute bg-orange-500 text-white py-1 px-3 rounded-full text-[10px] font-bold uppercase shadow-sm ${
              isSaleActive ? "top-11 left-3" : "top-3 left-3"
            }`}
          >
            Nổi bật
          </span>
        )}

        {isSaleActive && discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-600 text-white py-1 px-2 rounded-md text-[11px] font-bold shadow-md">
            SALE OFF {discount}%
          </span>
        )}

        {!isSaleActive && discount > 0 && (
          <span className="absolute top-3 right-14 bg-red-500 text-white py-1 px-2 rounded-md text-[11px] font-bold shadow-md">
            -{discount}%
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center mb-2 text-gray-500 text-[12px] dark:text-slate-400">
          <MapPin size={14} className="mr-1 text-blue-500" />
          <span>{city}</span>
        </div>

        <h3 className="text-md font-bold text-gray-800 mb-1 line-clamp-2 h-12 leading-tight dark:text-slate-100">
          <Link
            to={detailPath}
            className="hover:text-blue-600 transition-colors"
          >
            {title}
          </Link>
        </h3>

        {isSaleActive && countdownText && (
          <div className="mb-2.5 inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Kết thúc sau
            </span>
            <span className="text-[12px] font-extrabold tracking-wide">
              {countdownText.replace("Còn ", "")}
            </span>
          </div>
        )}

        {/* PHẦN HIỂN THỊ NGÀY ĐÊM */}
        <div className="flex items-center gap-1.5 text-blue-600 mb-4 bg-blue-50 w-fit px-2 py-0.5 rounded-md border border-blue-100/50">
          <Clock size={12} className="font-bold" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            {renderDuration(durationValue)}
          </span>
        </div>

        <div className="mt-auto border-t pt-3 flex justify-between items-end dark:border-slate-700">
          <div className="flex flex-col gap-0.5">
            {isSaleActive ? (
              <>
                <span className="text-gray-400 text-[11px] line-through decoration-red-400/40 font-normal">
                  {originalPrice.toLocaleString()}đ
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-red-500 font-bold text-xl leading-none">
                    {salePrice.toLocaleString()}
                  </span>
                  <span className="text-red-500 text-[13px] font-semibold">đ</span>
                </div>
              </>
            ) : showListStrikethrough ? (
              <>
                <span className="text-gray-400 text-[11px] line-through decoration-slate-400/70 font-normal">
                  {numOldPrice.toLocaleString()}đ
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-blue-600 font-bold text-xl leading-none">
                    {numPrice.toLocaleString()}
                  </span>
                  <span className="text-blue-600 text-[13px] font-semibold">đ</span>
                </div>
              </>
            ) : (
              <div className="flex items-baseline gap-0.5">
                <span className="text-blue-600 font-bold text-xl leading-none">
                  {numPrice.toLocaleString()}
                </span>
                <span className="text-blue-600 text-[13px] font-semibold">đ</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(detailPath)}
            className="bg-blue-600 text-white text-[11px] py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm mb-0.5"
          >
            Chi tiết
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TourCard;
