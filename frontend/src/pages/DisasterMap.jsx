import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Compass,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { AppContext } from "../context/AppContext";
import { fetchSafetyAlerts } from "../services/weatherService";

const VIETNAM_CENTER = [16.0, 108.0];
const DEFAULT_ZOOM = 5;

const severityStyles = {
  red: {
    label: "Cấp bách",
    border: "border-red-200",
    background: "bg-red-50",
    accent: "text-red-700",
    circleColor: "#ef4444",
  },
  orange: {
    label: "Cảnh báo",
    border: "border-orange-200",
    background: "bg-orange-50",
    accent: "text-orange-700",
    circleColor: "#f97316",
  },
  yellow: {
    label: "Chú ý",
    border: "border-amber-200",
    background: "bg-amber-50",
    accent: "text-amber-700",
    circleColor: "#f59e0b",
  },
  green: {
    label: "Ổn định",
    border: "border-emerald-200",
    background: "bg-emerald-50",
    accent: "text-emerald-700",
    circleColor: "#22c55e",
  },
};

const sampleDisasterRegions = [
  {
    id: "quangbinh-flood",
    title: "Ngập lụt Quảng Bình",
    status: "Ngập lụt",
    location: "Quảng Bình",
    type: "Lũ",
    severity: "red",
    level: "+2m",
    advice:
      "Không di chuyển qua khu vực này. Theo dõi thông tin từ chính quyền địa phương.",
    lat: 16.4512,
    lon: 107.6582,
    radius: 60000,
    updatedAt: "Gần đây",
  },
  {
    id: "laocai-landslide",
    title: "Sạt lở Lào Cai",
    status: "Sạt lở",
    location: "Lào Cai",
    type: "Sạt lở đất",
    severity: "orange",
    level: "+1.5m",
    advice: "Hạn chế di chuyển vào khu vực đồi núi. Tránh đường trơn trượt.",
    lat: 22.508,
    lon: 103.957,
    radius: 42000,
    updatedAt: "Gần đây",
  },
  {
    id: "binhthuan-drought",
    title: "Hạn hán Bình Thuận",
    status: "Hạn hán",
    location: "Bình Thuận",
    type: "Hạn hán",
    severity: "yellow",
    level: "-",
    advice: "Tiết kiệm nước và tránh đi vào vùng hạn hạn nếu không cần thiết.",
    lat: 10.949,
    lon: 107.9025,
    radius: 52000,
    updatedAt: "Hôm nay",
  },
];

const getSeverityKey = (value) => {
  if (!value) return "green";
  const normalized = value.toString().trim().toLowerCase();
  if (normalized.includes("red") || normalized.includes("đỏ")) return "red";
  if (normalized.includes("orange") || normalized.includes("cam"))
    return "orange";
  if (normalized.includes("yellow") || normalized.includes("vàng"))
    return "yellow";
  return "green";
};

const createMarkerIcon = (color) =>
  L.divIcon({
    className: "disaster-map-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${color};color:white;font-size:18px;box-shadow:0 0 0 3px rgba(255,255,255,0.85);">⚠️</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const buildDisasterItems = (apiAlerts) => {
  if (!apiAlerts || apiAlerts.length === 0) {
    return sampleDisasterRegions;
  }

  const hasGeo = apiAlerts.some((item) => item.lat != null && item.lon != null);
  if (!hasGeo) {
    return sampleDisasterRegions;
  }

  return apiAlerts.map((item, index) => {
    const severity = getSeverityKey(
      item.alertLevel || item.level || item.status,
    );
    return {
      id: item.id || item.title || `alert-${index}`,
      title: item.title || item.description || "Cảnh báo thiên tai",
      status: item.status || item.alertLevel || "Không xác định",
      location: item.location || item.country || "Không xác định",
      type: item.type || item.category || "Thiên tai",
      severity,
      level: item.level || item.alertLevel || "-",
      advice:
        item.advice ||
        item.description ||
        "Theo dõi thông tin từ cơ quan chức năng và hạn chế đi lại.",
      lat: item.lat,
      lon: item.lon,
      radius: item.radius || 50000,
      updatedAt: item.updatedAt || "Gần đây",
    };
  });
};

const DisasterMap = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchSafetyAlerts({ backendUrl });
        const items = buildDisasterItems(data.alerts);
        setAlerts(items);
        setActiveId(items.length > 0 ? items[0].id : null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Không thể tải dữ liệu cảnh báo. Đã sử dụng dữ liệu demo.",
        );
        setAlerts(sampleDisasterRegions);
        setActiveId(sampleDisasterRegions[0]?.id || null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [backendUrl]);

  useEffect(() => {
    if (!mapInstance || !activeId) return;
    const activeItem = alerts.find((item) => item.id === activeId);
    if (!activeItem || activeItem.lat == null || activeItem.lon == null) return;

    mapInstance.flyTo([activeItem.lat, activeItem.lon], 7, {
      duration: 1.1,
    });

    const marker = markerRefs.current[activeId];
    if (marker?.openPopup) {
      marker.openPopup();
    }
  }, [activeId, alerts, mapInstance]);

  const handleCardClick = (item) => {
    setActiveId(item.id);
  };

  const activeItem = useMemo(
    () => alerts.find((item) => item.id === activeId) || alerts[0],
    [alerts, activeId],
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                <AlertTriangle size={18} /> Bản đồ Cảnh báo Thiên tai
              </div>
              <h1 className="mt-4 text-3xl font-black text-slate-900">
                Theo dõi vùng thiên tai trên bản đồ Việt Nam
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Xem nhanh các khu vực bị ảnh hưởng, mức độ nguy hiểm và khuyến
                cáo an toàn trước khi lên kế hoạch du lịch.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/tours")}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Đặt tour ngay
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Danh sách cảnh báo
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn một vùng để bản đồ tự động di chuyển và mở chi tiết.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  {alerts.length} vùng
                </div>
              </div>

              {loading ? (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                  Đang tải dữ liệu cảnh báo...
                </div>
              ) : error ? (
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">
                  {error}
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((item) => {
                    const style =
                      severityStyles[item.severity] || severityStyles.green;
                    const isActive = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        className={`w-full rounded-[1.75rem] border p-5 text-left transition ${style.border} ${style.background} ${isActive ? "shadow-lg ring-1 ring-slate-300" : "hover:-translate-y-0.5 hover:shadow-sm"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                              <MapPin size={16} /> {item.location}
                            </div>
                            <h3 className="mt-3 text-lg font-black text-slate-900">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.status} · {item.type}
                            </p>
                          </div>
                          <div
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${style.accent} border ${style.border}`}
                          >
                            {style.label}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">
                              Mức nước / tình trạng
                            </span>
                            <span>{item.level}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">Cập nhật</span>
                            <span>{item.updatedAt}</span>
                          </div>
                          <p className="mt-3 rounded-3xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                            {item.advice}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <ShieldCheck className="h-6 w-6 text-sky-500" />
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Lời khuyên
                  </p>
                  <p className="text-sm text-slate-500">
                    Luôn chọn tour an toàn và chủ động theo dõi cảnh báo trước
                    khi khởi hành.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <Compass className="h-6 w-6 text-sky-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Bản đồ Việt Nam
                </h2>
                <p className="text-sm text-slate-500">
                  Tự động di chuyển đến vùng bị ảnh hưởng khi chọn tin cảnh báo.
                </p>
              </div>
            </div>

            <div className="relative h-[780px] overflow-hidden rounded-[2rem] border border-slate-100">
              <MapContainer
                center={VIETNAM_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                className="h-full w-full"
                whenCreated={setMapInstance}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {alerts
                  .filter((item) => item.lat != null && item.lon != null)
                  .flatMap((item) => {
                    const style =
                      severityStyles[item.severity] || severityStyles.green;
                    return [
                      <Marker
                        key={`${item.id}-marker`}
                        ref={(ref) => {
                          if (ref) {
                            markerRefs.current[item.id] = ref;
                          }
                        }}
                        position={[item.lat, item.lon]}
                        icon={createMarkerIcon(style.circleColor)}
                        eventHandlers={{
                          click: () => setActiveId(item.id),
                        }}
                      >
                        <Popup>
                          <div className="max-w-xs text-sm text-slate-800">
                            <p className="font-bold text-slate-900">
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              Tình trạng: {item.status}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Mức nước: {item.level}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Khuyến cáo:
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.advice}
                            </p>
                          </div>
                        </Popup>
                      </Marker>,
                      <Circle
                        key={`${item.id}-circle`}
                        center={[item.lat, item.lon]}
                        pathOptions={{
                          color: style.circleColor,
                          fillColor: style.circleColor,
                          fillOpacity: 0.16,
                        }}
                        radius={item.radius}
                      />,
                    ];
                  })}
              </MapContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DisasterMap;
