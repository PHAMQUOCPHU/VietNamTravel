import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { MapPin, Compass, Sparkles, Loader2 } from "lucide-react";
import { geoMercator, geoPath } from "d3-geo";
import { AppContext } from "../context/AppContext";
import { mapData } from "../assets";
import {
  normKey,
  resolveVisitedProvinces,
} from "../lib/vietnamCollectionMap.js";

const MAP_W = 1000;
const MAP_H = 620;
const PAD = 14;

/** 63 đơn vị hành chính cấp tỉnh hiện hành; GeoJSON có thể còn cả Hà Tây (đã sáp nhập). */
const OFFICIAL_PROVINCE_TOTAL = 63;

/**
 * Nhiều điểm nhỏ quanh tâm (rad lon/lat) để gợi hình quần đảo trên bản đồ nhỏ.
 */
function archipelagoDotCenters(groupName, centerLon, centerLat, count, spreadLon, spreadLat) {
  const dots = [];
  const phi = 1.618033988749895;
  for (let i = 0; i < count; i += 1) {
    const u = ((i + 1) * phi) % 1;
    const v = ((i + 3) * 0.380671) % 1;
    const angle = u * Math.PI * 2;
    const rad = 0.2 + v * 0.85;
    const wobble = 0.04 * Math.sin(i * 2.1);
    dots.push({
      id: `${groupName}-${i}`,
      group: groupName,
      lon: centerLon + Math.cos(angle) * spreadLon * rad + wobble * 0.5,
      lat: centerLat + Math.sin(angle) * spreadLat * rad + wobble,
    });
  }
  return dots;
}

const SEA_ARCHIPELAGO_CENTERS = [
  ...archipelagoDotCenters("Hoàng Sa", 112.34, 16.52, 16, 0.42, 0.28),
  ...archipelagoDotCenters("Trường Sa", 114.35, 9.35, 26, 1.15, 0.62),
];

const FILL_UNVISITED = "#c8d4e6";
const STROKE_DEFAULT = "rgba(15,23,42,0.35)";
const STROKE_HOVER = "#fbbf24";

export default function MyCollection() {
  const { backendUrl, token, user } = useContext(AppContext);
  const [visitedCities, setVisitedCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredName, setHoveredName] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const provinceNames = useMemo(
    () =>
      (mapData.vietnamGeo.features || []).map((f) => f.properties?.name).filter(Boolean),
    [],
  );

  const totalProvinces = OFFICIAL_PROVINCE_TOTAL;

  const { provinces: visitedProvinces, fillByNormKey } = useMemo(
    () => resolveVisitedProvinces(visitedCities, provinceNames),
    [visitedCities, provinceNames],
  );

  /** Hà Tây đã sáp nhập Hà Nội — chỉ tính một lần trong tiến độ 63 tỉnh. */
  const visitedCount = useMemo(() => {
    const keyHaNoi = normKey("Hà Nội");
    const keyHaTay = normKey("Hà Tây");
    const seen = new Set();
    for (const p of visitedProvinces) {
      const k = normKey(p);
      seen.add(k === keyHaTay ? keyHaNoi : k);
    }
    return seen.size;
  }, [visitedProvinces]);

  const pct =
    totalProvinces > 0
      ? Math.min(100, (visitedCount / totalProvinces) * 100)
      : 0;

  /** projection + pathGenerator — fitExtent để luôn thấy trọn Việt Nam */
  const { projection, paths } = useMemo(() => {
    const fc = {
      type: "FeatureCollection",
      features: mapData.vietnamGeo.features || [],
    };
    const projection = geoMercator();
    projection.fitExtent(
      [
        [PAD, PAD],
        [MAP_W - PAD, MAP_H - PAD],
      ],
      fc,
    );
    const pathGen = geoPath(projection);
    const paths = (mapData.vietnamGeo.features || []).map((feature, i) => ({
      id: `p-${i}`,
      d: pathGen(feature),
      name: feature.properties?.name || "",
    }));
    return { projection, paths };
  }, []);

  const fillForName = useCallback(
    (name) => {
      const nk = normKey(name);
      if (fillByNormKey.has(nk)) return fillByNormKey.get(nk);
      if (nk === normKey("Hà Tây"))
        return fillByNormKey.get(normKey("Hà Nội")) || FILL_UNVISITED;
      return FILL_UNVISITED;
    },
    [fillByNormKey],
  );

  const isVisitedName = useCallback(
    (name) => {
      const nk = normKey(name);
      if (fillByNormKey.has(nk)) return true;
      if (nk === normKey("Hà Tây")) return fillByNormKey.has(normKey("Hà Nội"));
      return false;
    },
    [fillByNormKey],
  );

  const seaPoints = useMemo(() => {
    return SEA_ARCHIPELAGO_CENTERS.map((m) => {
      const xy = projection([m.lon, m.lat]);
      return { ...m, x: xy ? xy[0] : 0, y: xy ? xy[1] : 0 };
    });
  }, [projection]);

  const seaGroupCenters = useMemo(
    () =>
      ["Hoàng Sa", "Trường Sa"]
        .map((group) => {
          const pts = seaPoints.filter((p) => p.group === group);
          if (!pts.length) return null;
          let sx = 0;
          let sy = 0;
          for (const p of pts) {
            sx += p.x;
            sy += p.y;
          }
          return { group, x: sx / pts.length, y: sy / pts.length };
        })
        .filter(Boolean),
    [seaPoints],
  );

  useEffect(() => {
    const fetchCollection = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/bookings/my-collection`,
          { headers: { token } },
        );
        if (res.data.success && Array.isArray(res.data.cities)) {
          setVisitedCities(res.data.cities);
        }
      } catch {
        setVisitedCities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [token, backendUrl]);

  const onMapMouseMove = (e) => {
    setPointer({ x: e.clientX, y: e.clientY });
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-xl shadow-slate-200/50">
          <Compass className="mx-auto h-12 w-12 text-sky-500" strokeWidth={1.5} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Đăng nhập để xem bộ sưu tập
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Các tỉnh bạn đã hoàn thành tour sẽ hiển thị trên bản đồ Việt Nam.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
      {hoveredName ? (
        <div
          className="pointer-events-none fixed z-[200] rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-sm font-semibold text-white shadow-2xl shadow-slate-900/40"
          style={{
            left:
              typeof window !== "undefined"
                ? Math.max(8, Math.min(pointer.x + 14, window.innerWidth - 140))
                : pointer.x + 14,
            top: Math.max(8, pointer.y - 44),
          }}
        >
          {hoveredName}
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Bộ sưu tập
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Sparkles className="h-7 w-7 shrink-0 text-amber-500" strokeWidth={2} />
              Hành trình của{" "}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                {user?.name || "bạn"}
              </span>
            </h1>
            <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-slate-600 sm:text-[15px] sm:leading-relaxed">
              <p className="border-l-4 border-sky-500/80 pl-4 font-medium text-slate-700">
                Mỗi bước chân đi, thêm yêu bờ cõi. Hành trình nối liền dải đất hình chữ
                S cùng hai quần đảo Hoàng Sa, Trường Sa thiêng liêng của Tổ quốc.
              </p>
              <p className="pl-1 text-slate-600">
                Việt Nam mình đâu đâu cũng đẹp. Hãy cùng{" "}
                <span className="font-semibold text-sky-700">VietNam Travel</span> đi
                khắp 63 tỉnh thành, viết tiếp những trang hành trình rực rỡ trên bản đồ
                hình chữ S.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-lg shadow-slate-200/40 backdrop-blur sm:items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tabular-nums text-orange-500">
                {visitedCount}
              </span>
              <span className="text-lg font-semibold text-slate-400">/</span>
              <span className="text-xl font-bold text-slate-600">
                {totalProvinces}
              </span>
              <span className="text-sm font-medium text-slate-500">tỉnh thành</span>
            </div>
            <div className="h-2 w-full min-w-[200px] overflow-hidden rounded-full bg-slate-100 sm:w-56">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs font-medium text-slate-400">
              {pct.toFixed(1)}% Việt Nam
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="overflow-hidden rounded-[2rem] border border-cyan-900/30 bg-gradient-to-br from-[#042f4a] via-[#063651] to-[#042f4a] shadow-2xl shadow-cyan-900/20"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-5 w-5 text-cyan-300" />
              <span className="text-sm font-semibold">Bản đồ Việt Nam</span>
            </div>
            {loading ? (
              <span className="flex items-center gap-2 text-xs text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải…
              </span>
            ) : null}
          </div>

          <div
            className="relative"
            onMouseMove={onMapMouseMove}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_30%,rgba(34,211,238,0.12),transparent_50%)]" />

            <div className="relative mx-auto w-full max-w-full overflow-hidden px-2 py-4 sm:px-4 sm:py-6">
              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="block h-auto w-full max-w-full"
                style={{ maxHeight: "min(75vh, 720px)" }}
                role="img"
                aria-label="Bản đồ Việt Nam"
              >
                <rect width={MAP_W} height={MAP_H} fill="#082f49" />
                <g>
                  {paths.map((p) => {
                    if (!p.d) return null;
                    const fill = fillForName(p.name);
                    const visited = isVisitedName(p.name);
                    const active = hoveredId === p.id;
                    return (
                      <path
                        key={p.id}
                        d={p.d}
                        fill={fill}
                        stroke={active ? STROKE_HOVER : STROKE_DEFAULT}
                        strokeWidth={active ? 1.4 : visited ? 0.65 : 0.45}
                        vectorEffect="non-scaling-stroke"
                        className="cursor-pointer transition-[fill,stroke,stroke-width] duration-150"
                        onMouseEnter={() => {
                          setHoveredName(p.name);
                          setHoveredId(p.id);
                        }}
                        onMouseLeave={() => {
                          setHoveredName("");
                          setHoveredId(null);
                        }}
                      />
                    );
                  })}
                </g>
                <g className="pointer-events-none">
                  {seaPoints.map((pt, idx) => {
                    const active = hoveredId === `sea-${pt.group}`;
                    const baseR = pt.group === "Trường Sa" ? 1.65 : 1.85;
                    return (
                      <circle
                        key={pt.id}
                        cx={pt.x}
                        cy={pt.y}
                        r={active ? baseR + 0.45 : baseR}
                        fill={active ? "#67e8f9" : "#22d3ee"}
                        fillOpacity={
                          active ? 0.95 : 0.52 + (idx % 6) * 0.045
                        }
                        stroke="rgba(255,255,255,0.55)"
                        strokeWidth={0.35}
                        style={{
                          filter: active
                            ? "drop-shadow(0 0 3px rgba(103,232,249,0.85))"
                            : "drop-shadow(0 0 1px rgba(34,211,238,0.35))",
                        }}
                      />
                    );
                  })}
                </g>
                <g
                  className="pointer-events-none select-none"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  {seaGroupCenters.map(({ group, x, y }) => {
                    const active = hoveredId === `sea-${group}`;
                    const labelY = y + (group === "Trường Sa" ? -36 : -30);
                    return (
                      <g key={`label-${group}`}>
                        <text
                          x={x}
                          y={labelY}
                          textAnchor="middle"
                          fill={active ? "#f0fdfa" : "#ecfeff"}
                          stroke="#0c4a6e"
                          strokeWidth={active ? 4 : 3.2}
                          paintOrder="stroke fill"
                          fontSize={group === "Trường Sa" ? 14 : 15}
                          fontWeight="800"
                          letterSpacing="0.08em"
                          style={{
                            filter: active
                              ? "drop-shadow(0 0 8px rgba(34,211,238,0.65))"
                              : "drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
                          }}
                        >
                          {group}
                        </text>
                        <text
                          x={x}
                          y={labelY + 16}
                          textAnchor="middle"
                          fill="rgba(165,243,252,0.92)"
                          stroke="rgba(8,47,73,0.85)"
                          strokeWidth={2}
                          paintOrder="stroke fill"
                          fontSize={9}
                          fontWeight="700"
                          letterSpacing="0.18em"
                        >
                          VIỆT NAM
                        </text>
                      </g>
                    );
                  })}
                </g>
                <g>
                  {seaGroupCenters.map(({ group, x, y }) => (
                      <circle
                        key={`hit-${group}`}
                        cx={x}
                        cy={y}
                        r={group === "Trường Sa" ? 42 : 28}
                        fill="transparent"
                        className="cursor-pointer pointer-events-auto"
                        onMouseEnter={() => {
                          setHoveredName(group);
                          setHoveredId(`sea-${group}`);
                        }}
                        onMouseLeave={() => {
                          setHoveredName("");
                          setHoveredId(null);
                        }}
                        aria-label={group}
                      />
                  ))}
                </g>
              </svg>
            </div>

            {!loading && visitedCount === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#042f4a]/65 px-6 backdrop-blur-[2px]">
                <p className="max-w-md text-center text-sm font-medium text-white/90">
                  Chưa có tỉnh nào được ghi nhận. Hãy hoàn thành tour (đơn{" "}
                  <strong>đã xác nhận</strong> và ngày kết thúc tour đã qua) để tỉnh
                  sáng màu trên bản đồ.
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>

        {visitedProvinces.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Đã ghé
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {visitedProvinces.map((p) => (
                <li
                  key={p}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                    style={{
                      backgroundColor:
                        fillByNormKey.get(normKey(p)) || "#94a3b8",
                    }}
                  />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
