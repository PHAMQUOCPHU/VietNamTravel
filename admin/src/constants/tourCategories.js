export const TOUR_CATEGORY_VALUES = [
  "Nghỉ dưỡng",
  "Khám phá",
  "Ẩm thực",
  "Văn hóa – lịch sử",
  "Sinh thái",
  "Phượt / mạo hiểm",
];

export const TOUR_CATEGORY_LABELS = {
  "Nghỉ dưỡng": "Nghỉ dưỡng 🏝️",
  "Khám phá": "Khám phá 🏔️",
  "Ẩm thực": "Ẩm thực 🍜",
  "Văn hóa – lịch sử": "Văn hóa – lịch sử 🏛️",
  "Sinh thái": "Sinh thái 🌿",
  "Phượt / mạo hiểm": "Phượt / mạo hiểm 🚵",
};

const LEGACY_MAP = {
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
  if (TOUR_CATEGORY_VALUES.includes(raw)) return raw;
  return LEGACY_MAP[raw] || "Khám phá";
}
