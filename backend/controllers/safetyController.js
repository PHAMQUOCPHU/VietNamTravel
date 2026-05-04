import axios from "axios";

const GDACS_RSS = "https://www.gdacs.org/xml/rss.xml";

const TYPE_LABELS = {
  EQ: "Động đất",
  VO: "Núi lửa",
  TC: "Bão / áp thấp nhiệt đới",
  FL: "Lũ lụt",
  DR: "Hạn hán",
  WF: "Cháy rừng",
  UNKNOWN: "Sự kiện thiên tai",
};

const SEVERITY_ORDER = { red: 4, orange: 3, yellow: 2, green: 1 };

const parseTag = (tag, content) => {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : null;
};

const pickStrongerSeverity = (a, b) => {
  const na = SEVERITY_ORDER[String(a || "").toLowerCase()] || 1;
  const nb = SEVERITY_ORDER[String(b || "").toLowerCase()] || 1;
  if (nb > na) return String(b || "green").toLowerCase();
  return String(a || "green").toLowerCase();
};

/** lonmin lonmax latmin latmax — theo ghi chú trong feed GDACS */
const parseBbox = (raw) => {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [lonmin, lonmax, latmin, latmax] = parts;
  return { lonmin, lonmax, latmin, latmax };
};

/** Bán kính ~mét từ bbox (hình chữ nhật gần đúng) */
const radiusMetersFromBbox = ({ latmin, latmax, lonmin, lonmax }) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const latMid = ((latmin + latmax) / 2) * (Math.PI / 180);
  const dLat = (latmax - latmin) * (Math.PI / 180);
  const dLon = (lonmax - lonmin) * (Math.PI / 180);
  const halfDiag = Math.sqrt(
    (dLat * R) ** 2 + (dLon * R * Math.cos(latMid || 0.001)) ** 2,
  );
  return Math.min(950_000, Math.max(28_000, halfDiag * 0.65));
};

const touchesVietnam = (alert) => {
  const blob = `${alert.title || ""} ${alert.country || ""}`.toLowerCase();
  if (/\bvietnam\b|\bviet nam\b|\bviệt nam\b/.test(blob)) return true;
  if (String(alert.iso3 || "").toUpperCase() === "VNM") return true;
  if (
    alert.lat != null &&
    alert.lon != null &&
    Number.isFinite(alert.lat) &&
    Number.isFinite(alert.lon)
  ) {
    return (
      alert.lon >= 102 &&
      alert.lon <= 109.8 &&
      alert.lat >= 8.3 &&
      alert.lat <= 23.9
    );
  }
  return false;
};

const parseItem = (item) => {
  const title = parseTag("title", item) || "Cảnh báo thiên tai";
  const description = parseTag("description", item) || "Không có mô tả cụ thể.";
  const baseLevel = parseTag("gdacs:alertlevel", item) || "Green";
  const episodeLevel = parseTag("gdacs:episodealertlevel", item);
  const alertLevel = pickStrongerSeverity(baseLevel, episodeLevel);
  const eventType = (parseTag("gdacs:eventtype", item) || "UNKNOWN").toUpperCase();
  const country = parseTag("gdacs:country", item) || "Không xác định";
  const iso3 = (parseTag("gdacs:iso3", item) || "").toUpperCase();
  const link = parseTag("link", item) || "";
  const rawLat = parseTag("geo:lat", item);
  const rawLon = parseTag("geo:long", item);
  const point = parseTag("georss:point", item);
  let lat =
    rawLat != null && rawLat !== "" && Number.isFinite(Number(rawLat))
      ? Number(rawLat)
      : null;
  let lon =
    rawLon != null && rawLon !== "" && Number.isFinite(Number(rawLon))
      ? Number(rawLon)
      : null;

  if ((lat == null || lon == null) && point) {
    const coords = point.split(/\s+/).map((x) => Number(x.trim()));
    if (
      coords.length === 2 &&
      Number.isFinite(coords[0]) &&
      Number.isFinite(coords[1])
    ) {
      [lat, lon] = coords;
    }
  }

  const bboxRaw = parseTag("gdacs:bbox", item);
  const bbox = parseBbox(bboxRaw);
  let radius = null;
  if (bbox) {
    if (lat == null || lon == null) {
      lat = (bbox.latmin + bbox.latmax) / 2;
      lon = (bbox.lonmin + bbox.lonmax) / 2;
    }
    radius = radiusMetersFromBbox(bbox);
  }

  if (lat != null && lon != null && (!Number.isFinite(lat) || !Number.isFinite(lon))) {
    lat = null;
    lon = null;
  }

  const severity = String(alertLevel).trim().toLowerCase();
  const location = country || title;
  const typeLabel = TYPE_LABELS[eventType] || TYPE_LABELS.UNKNOWN;

  const adviceMap = {
    red: "Tránh di chuyển đến vùng ảnh hưởng; tuân thủ chỉ đạo của chính quyền địa phương.",
    orange: "Rủi ro cao — hạn chế hoạt động ngoài trời và theo dõi tin chính thức.",
    yellow: "Cẩn trọng; hạn chế đi lại nếu không cần thiết và cập nhật dự báo thường xuyên.",
    green: "Mức cảnh báo thấp trên thang GDACS; vẫn nên theo dõi tin tức khi lên lịch du lịch.",
  };

  const updatedAt =
    parseTag("gdacs:datemodified", item) ||
    parseTag("gdacs:dateadded", item) ||
    parseTag("pubDate", item) ||
    "";

  const severityBand = (() => {
    if (lat == null || lon == null) return "all";
    const withinVietnam = lon >= 102 && lon <= 110 && lat >= 8 && lat <= 24;
    if (!withinVietnam) return "all";
    if (lat >= 16) return "north";
    if (lat >= 13) return "central";
    return "south";
  })();

  const population = parseTag("gdacs:population", item);
  const severityText = parseTag("gdacs:severity", item);

  return {
    id: parseTag("guid", item) || link || title,
    title,
    description,
    alertLevel: severity,
    type: eventType,
    typeLabel,
    location,
    country,
    iso3,
    lat,
    lon,
    radius: radius ?? (severity === "red" ? 72000 : severity === "orange" ? 56000 : 42000),
    link,
    advice: adviceMap[severity] || adviceMap.green,
    region: severityBand,
    updatedAt,
    level: severityText || population || alertLevel,
    source: "GDACS",
  };
};

export const getSafetyAlerts = async (req, res) => {
  try {
    const response = await axios.get(GDACS_RSS, {
      timeout: 15000,
      responseType: "text",
      headers: {
        "User-Agent":
          "VietNamTravel/1.0 (+https://github.com/PHAMQUOCPHU/VietNamTravel; safety alerts)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    const raw = response.data || "";
    const chunks = raw.split(/<item>/i).slice(1);

    let alerts = chunks
      .map((chunk) => parseItem(chunk))
      .filter((alert) => alert.title && alert.description);

    const region = String(req.query.region || "all").toLowerCase();
    if (region === "vn" || region === "vietnam") {
      alerts = alerts.filter(touchesVietnam);
    }

    const limit = Math.min(
      120,
      Math.max(10, Number.parseInt(String(req.query.limit || "60"), 10) || 60),
    );
    alerts = alerts.slice(0, limit);

    res.json({
      success: true,
      source: GDACS_RSS,
      fetchedAt: new Date().toISOString(),
      region: region === "vn" || region === "vietnam" ? "vn" : "all",
      alerts,
    });
  } catch (error) {
    console.error("[safety] fetch alerts:", error.message);
    res.status(502).json({
      success: false,
      message:
        "Không thể lấy dữ liệu cảnh báo từ GDACS lúc này. Vui lòng thử lại sau.",
    });
  }
};
