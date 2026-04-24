import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudRain,
  Sun,
} from "lucide-react";

export const normWeatherCityKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ");

export const WEATHER_CITY_QUERY_MAP = {
  "vung tau": ["Vung Tau, VN", "Ba Ria Vung Tau, VN"],
  "ba ria - vung tau": ["Ba Ria Vung Tau, VN", "Vung Tau, VN"],
  "ba ria vung tau": ["Ba Ria Vung Tau, VN", "Vung Tau, VN"],
  "tp ho chi minh": ["Ho Chi Minh City, VN", "Saigon, VN"],
  tphcm: ["Ho Chi Minh City, VN", "Saigon, VN"],
  "sai gon": ["Ho Chi Minh City, VN", "Saigon, VN"],
  "da lat": ["Da Lat, VN", "Lam Dong, VN"],
  "lam dong": ["Da Lat, VN", "Lam Dong, VN"],
  "a lat": ["Da Lat, VN"],
  "nha trang": ["Nha Trang, VN", "Khanh Hoa, VN"],
  "ha noi": ["Hanoi, VN"],
  "da nang": ["Da Nang, VN"],
};

export const CITY_COORD_FALLBACK = {
  "da lat": { lat: 11.9404, lon: 108.4583 },
  "lam dong": { lat: 11.9404, lon: 108.4583 },
  "a lat": { lat: 11.9404, lon: 108.4583 },
  "vung tau": { lat: 10.346, lon: 107.0843 },
  "nha trang": { lat: 12.2388, lon: 109.1967 },
  "ha noi": { lat: 21.0285, lon: 105.8542 },
  "da nang": { lat: 16.0544, lon: 108.2022 },
  "tp ho chi minh": { lat: 10.7769, lon: 106.7009 },
  tphcm: { lat: 10.7769, lon: 106.7009 },
  "sai gon": { lat: 10.7769, lon: 106.7009 },
};

export const isCoordLikelyVietnam = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= 8.2 &&
  lat <= 24 &&
  lon >= 102 &&
  lon <= 110;

export const pickGeoResult = (results) => {
  if (!Array.isArray(results) || results.length === 0) return null;
  const vn = results.find((r) => String(r.country || "").toUpperCase() === "VN");
  if (vn) return vn;
  const inside = results.find((r) => isCoordLikelyVietnam(r.lat, r.lon));
  return inside || null;
};

export const getWeatherIcon = (main) => {
  switch (main) {
    case "Clear":
      return { Icon: Sun, className: "text-orange-400" };
    case "Clouds":
      return { Icon: Cloud, className: "text-gray-400" };
    case "Rain":
    case "Drizzle":
      return { Icon: CloudRain, className: "text-blue-400" };
    case "Thunderstorm":
      return { Icon: CloudLightning, className: "text-purple-500" };
    default:
      return { Icon: Cloud, className: "text-gray-400" };
  }
};

export const getTravelAdvice = ({ selectedItem, city }) => {
  if (!selectedItem) return null;
  const hasRain = ["Rain", "Thunderstorm", "Drizzle"].includes(selectedItem.weather[0].main);
  if (hasRain) {
    return {
      status: "Nên cân nhắc",
      desc: `Dự báo tại ${city} có mưa. Nhớ mang theo ô nhé!`,
      icon: { Icon: AlertCircle, className: "text-amber-500" },
      color: "bg-amber-50 text-amber-900 border-amber-200",
    };
  }
  return {
    status: "Khởi hành ngay",
    desc: `Thời tiết tại ${city} cực đẹp.`,
    icon: { Icon: CheckCircle2, className: "text-emerald-500" },
    color: "bg-emerald-50 text-emerald-900 border-emerald-200",
  };
};
