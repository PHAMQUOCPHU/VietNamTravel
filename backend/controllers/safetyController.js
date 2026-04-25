import axios from "axios";

const parseTag = (tag, content) => {
  const regex = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : null;
};

const parseItem = (item) => {
  const title = parseTag("title", item) || "Cảnh báo thiên tai";
  const description = parseTag("description", item) || "Không có mô tả cụ thể.";
  const alertLevel = parseTag("gdacs:alertlevel", item) || "Green";
  const eventType = parseTag("gdacs:eventtype", item) || "UNKNOWN";
  const country = parseTag("gdacs:country", item) || "Không xác định";
  const link = parseTag("link", item) || "";
  const rawLat = parseTag("geo:lat", item);
  const rawLon = parseTag("geo:long", item);
  const point = parseTag("georss:point", item);
  let lat = rawLat ? Number(rawLat) : null;
  let lon = rawLon ? Number(rawLon) : null;

  if ((!lat || !lon) && point) {
    const coords = point.split(" ").map((x) => Number(x.trim()));
    if (
      coords.length === 2 &&
      Number.isFinite(coords[0]) &&
      Number.isFinite(coords[1])
    ) {
      lat = coords[0];
      lon = coords[1];
    }
  }

  const severity = alertLevel.trim().toLowerCase();
  const location = country || title;

  const adviceMap = {
    red: "Tránh di chuyển đến vùng này và tuân thủ hướng dẫn địa phương.",
    orange: "Rất nguy hiểm, hạn chế mọi hoạt động ngoài trời.",
    yellow: "Cẩn trọng, hạn chế đi lại nếu không cần thiết.",
    green: "Tình hình tương đối ổn định, tiếp tục theo dõi tin tức.",
  };

  const region = (() => {
    if (lat == null || lon == null) return "all";
    const withinVietnam = lon >= 102 && lon <= 110 && lat >= 8 && lat <= 24;
    if (!withinVietnam) return "all";
    if (lat >= 16) return "north";
    if (lat >= 13) return "central";
    return "south";
  })();

  return {
    id: parseTag("guid", item) || link || title,
    title,
    description,
    alertLevel: severity,
    type: eventType,
    location,
    country,
    lat,
    lon,
    link,
    advice: adviceMap[severity] || adviceMap.green,
    region,
  };
};

export const getSafetyAlerts = async (req, res) => {
  try {
    const response = await axios.get("https://www.gdacs.org/xml/rss.xml", {
      timeout: 10000,
      responseType: "text",
    });

    const raw = response.data || "";
    const items = raw.split(/<item>/i).slice(1);

    const alerts = items
      .map((itemContent) => parseItem(itemContent))
      .filter((alert) => alert.title && alert.description);

    res.json({ success: true, alerts });
  } catch (error) {
    console.error("[safety] fetch alerts:", error.message);
    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu cảnh báo thiên tai lúc này.",
    });
  }
};
