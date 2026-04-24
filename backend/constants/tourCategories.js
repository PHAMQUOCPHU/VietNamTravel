/** Giá trị lưu DB (không kèm emoji) — đồng bộ với enum TourModel */
export const TOUR_CATEGORY_ENUM = [
  "Nghỉ dưỡng",
  "Khám phá",
  "Ẩm thực",
  "Văn hóa – lịch sử",
  "Sinh thái",
  "Phượt / mạo hiểm",
];

/** Map loại hình cũ → loại mới (chạy migrate hoặc fallback khi đọc dữ liệu cũ) */
export const LEGACY_TOUR_CATEGORY_MAP = {
  Biển: "Nghỉ dưỡng",
  "Tâm linh": "Văn hóa – lịch sử",
  "Lịch sử": "Văn hóa – lịch sử",
  Núi: "Khám phá",
  "Nghỉ dưỡng": "Nghỉ dưỡng",
  "Khám phá": "Khám phá",
};

export function normalizeTourCategory(category) {
  const raw = category == null ? "" : String(category).trim();
  if (!raw) return "Khám phá";
  if (TOUR_CATEGORY_ENUM.includes(raw)) return raw;
  return LEGACY_TOUR_CATEGORY_MAP[raw] || "Khám phá";
}
