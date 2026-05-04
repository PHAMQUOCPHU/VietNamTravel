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
  Globe2,
  MapPinned,
  RefreshCw,
  ExternalLink,
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

const normalizeAlerts = (apiAlerts) => {
  if (!Array.isArray(apiAlerts) || apiAlerts.length === 0) return [];

  return apiAlerts.map((item, index) => {
    const severity = getSeverityKey(
      item.alertLevel || item.level || item.status,
    );
    const lat =
      item.lat != null && Number.isFinite(Number(item.lat))
        ? Number(item.lat)
        : null;
    const lon =
      item.lon != null && Number.isFinite(Number(item.lon))
        ? Number(item.lon)
        : null;
    const radius =
      item.radius != null && Number.isFinite(Number(item.radius))
        ? Number(item.radius)
        : 50000;

    return {
      id: String(item.id || item.title || `alert-${index}`),
      title: item.title || item.description || "Cảnh báo thiên tai",
      status: item.status || item.alertLevel || "Không xác định",
      location: item.location || item.country || "Không xác định",
      type: item.typeLabel || item.type || item.category || "Sự kiện",
      severity,
      level: item.level || item.alertLevel || "—",
      advice:
        item.advice ||
        item.description ||
        "Theo dõi thông tin từ cơ quan chức năng và hạn chế đi lại khi cần.",
      lat,
      lon,
      radius,
      updatedAt: item.updatedAt || "—",
      link: item.link || "",
      description: item.description || "",
    };
  });
};

const DisasterMap = () => {
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ source: "", fetchedAt: "", region: "all" });
  const [regionFilter, setRegionFilter] = useState("vn");
  const [activeId, setActiveId] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markerRefs = useRef({});

  const loadData = async (region) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSafetyAlerts({ backendUrl, region });
      if (!data.success) {
        setError(data.message || "Không tải được dữ liệu.");
        setAlerts([]);
        setActiveId(null);
        return;
      }
      const items = normalizeAlerts(data.alerts);
      setAlerts(items);
      setMeta({
        source: data.source || "",
        fetchedAt: data.fetchedAt || "",
        region: data.region || region,
      });
      const firstWithGeo = items.find((x) => x.lat != null && x.lon != null);
      setActiveId(firstWithGeo?.id ?? items[0]?.id ?? null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể kết nối máy chủ để lấy cảnh báo.",
      );
      setAlerts([]);
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(regionFilter);
  }, [backendUrl, regionFilter]);

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

  const geoCount = useMemo(
    () => alerts.filter((a) => a.lat != null && a.lon != null).length,
    [alerts],
  );

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 dark:bg-slate-950 sm:px-4 sm:py-10 md:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mb-8 sm:rounded-[2rem] sm:p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 sm:px-4 sm:py-2 sm:text-sm">
                <AlertTriangle size={18} /> Bản đồ cảnh báo thiên tai
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight text-slate-900 dark:text-white sm:mt-4 sm:text-3xl md:text-4xl">
                Theo dõi cảnh báo thiên tai (dữ liệu GDACS)
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Dữ liệu được lấy trực tiếp qua API từ nguồn{" "}
                <strong>GDACS</strong> (Ủy ban châu Âu / JRC), cập nhật theo
                feed RSS — không dùng dữ liệu demo. Bạn có thể lọc tin liên quan
                đến Việt Nam hoặc xem toàn cầu.
              </p>
              {meta.fetchedAt && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  Cập nhật gói tin:{" "}
                  {new Date(meta.fetchedAt).toLocaleString("vi-VN")} ·{" "}
                  {regionFilter === "vn"
                    ? "Phạm vi: Việt Nam & liên quan"
                    : "Phạm vi: toàn cầu"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setRegionFilter("vn")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    regionFilter === "vn"
                      ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <MapPinned size={16} />
                  Việt Nam
                </button>
                <button
                  type="button"
                  onClick={() => setRegionFilter("all")}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    regionFilter === "all"
                      ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Globe2 size={16} />
                  Toàn cầu
                </button>
              </div>
              <button
                type="button"
                onClick={() => loadData(regionFilter)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Tải lại
              </button>
              <button
                type="button"
                onClick={() => navigate("/tours")}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Đặt tour ngay
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Danh sách cảnh báo
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Chọn một mục để bản đồ bay tới (nếu có tọa độ).
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {alerts.length} tin
                </div>
              </div>

              {geoCount < alerts.length && alerts.length > 0 && (
                <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  {geoCount}/{alerts.length} tin có tọa độ hiển thị trên bản đồ.
                  Các tin còn lại vẫn xem được chi tiết bên dưới.
                </p>
              )}

              {loading ? (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  Đang tải dữ liệu từ GDACS…
                </div>
              ) : error ? (
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                  {error}
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Không có tin cảnh báo trong bộ lọc hiện tại. Thử chuyển sang{" "}
                  <strong>Toàn cầu</strong> hoặc bấm <strong>Tải lại</strong>.
                </div>
              ) : (
                <div className="space-y-4 max-h-[min(72vh,720px)] overflow-y-auto pr-1">
                  {alerts.map((item) => {
                    const style =
                      severityStyles[item.severity] || severityStyles.green;
                    const isActive = activeId === item.id;
                    const noGeo = item.lat == null || item.lon == null;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        className={`w-full rounded-2xl border p-4 text-left transition sm:rounded-[1.75rem] sm:p-5 ${style.border} ${style.background} ${isActive ? "shadow-lg ring-1 ring-slate-300 dark:ring-slate-600" : "hover:-translate-y-0.5 hover:shadow-sm"} ${noGeo ? "opacity-95" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                              <MapPin size={16} className="shrink-0" />
                              <span className="truncate">{item.location}</span>
                              {noGeo && (
                                <span className="normal-case rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  Chưa có điểm bản đồ
                                </span>
                              )}
                            </div>
                            <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">
                              {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                              {item.status} · {item.type}
                            </p>
                          </div>
                          <div
                            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${style.accent} border ${style.border}`}
                          >
                            {style.label}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Mức độ / quy mô
                            </span>
                            <span className="text-right text-xs sm:text-sm">
                              {item.level}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Cập nhật (GDACS)
                            </span>
                            <span className="text-right text-xs">
                              {item.updatedAt}
                            </span>
                          </div>
                          <p className="mt-3 rounded-3xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                            {item.advice}
                          </p>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              Mở báo cáo GDACS
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-200 sm:items-center">
                <ShieldCheck className="h-6 w-6 shrink-0 text-sky-500" />
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                    Lưu ý sử dụng dữ liệu
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    GDACS phản ánh rủi ro nhân đạo toàn cầu; khi lên kế hoạch du
                    lịch trong nước, luôn kết hợp với dự báo của Đài Khí tượng
                    Thủy văn và chỉ đạo địa phương.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-[2rem] sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Compass className="h-6 w-6 text-sky-500" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Bản đồ
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    OpenStreetMap + vòng ảnh hưởng gần đúng theo bán kính từ
                    feed.
                  </p>
                </div>
              </div>
              {meta.source && (
                <a
                  href={meta.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Nguồn RSS GDACS
                </a>
              )}
            </div>

            <div className="relative h-[min(52vh,440px)] min-h-[260px] overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 sm:h-[min(58vh,520px)] sm:min-h-[320px] md:rounded-[2rem] lg:h-[min(70vh,640px)] xl:h-[780px] xl:min-h-[780px]">
              <MapContainer
                center={VIETNAM_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
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
                              {item.type} · {item.location}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Mức: {item.level}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-700">
                              Khuyến cáo:
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.advice}
                            </p>
                            {item.link && (
                              <a
                                className="mt-2 inline-block text-sm font-bold text-blue-600 hover:underline"
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Chi tiết GDACS →
                              </a>
                            )}
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
