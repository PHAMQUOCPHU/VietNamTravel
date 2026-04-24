/** Chuẩn hóa chuỗi để so khớp tên tỉnh / thành (tránh lệch Unicode giữa API và GeoJSON) */
export function normKey(str) {
  if (!str) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2000-\u200b]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Key = normKey(tên điểm đến trong DB) → tên tỉnh trong GeoJSON */
export const CITY_TO_PROVINCE_NORM = {
  "da lat": "Lâm Đồng",
  dalat: "Lâm Đồng",
  "nha trang": "Khánh Hòa",
  nhatrang: "Khánh Hòa",
  "phan thiet": "Bình Thuận",
  "mui ne": "Bình Thuận",
  hue: "Thừa Thiên–Huế",
  "hoi an": "Quảng Nam",
  sapa: "Lào Cai",
  "sa pa": "Lào Cai",
  "phu quoc": "Kiên Giang",
  "vung tau": "Bà Rịa–Vũng Tàu",
  "ha long": "Quảng Ninh",
  "ha long bay": "Quảng Ninh",
  halong: "Quảng Ninh",
  "can tho": "Cần Thơ",
  "da nang": "Đà Nẵng",
  "ha noi": "Hà Nội",
  "tp ho chi minh": "Hồ Chí Minh",
  "ho chi minh": "Hồ Chí Minh",
  "tp hcm": "Hồ Chí Minh",
  tphcm: "Hồ Chí Minh",
  "sai gon": "Hồ Chí Minh",
  "ninh binh": "Ninh Bình",
  "trang an": "Ninh Bình",
  "tam coc": "Ninh Bình",
  "mai chau": "Hòa Bình",
  "cat ba": "Hải Phòng",
  "dak lak": "Đắk Lắk",
  "buon ma thuot": "Đắk Lắk",
  pleiku: "Gia Lai",
  "kon tum": "Kon Tum",
  "phan rang": "Ninh Thuận",
  "vinh hy": "Ninh Thuận",
  "ben tre": "Bến Tre",
  "cai rang": "Cần Thơ",
  "chau doc": "An Giang",
  "ca mau": "Cà Mau",
  "thai nguyen": "Thái Nguyên",
};

export const VISIT_PALETTE = [
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#22c55e",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
  "#a855f7",
  "#0ea5e9",
  "#10b981",
];

/**
 * @returns {{ provinces: string[], fillByNormKey: Map<string, string> }}
 * Màu lưu theo normKey(tên tỉnh) để khớp chắc chắn với path trên bản đồ.
 */
export function resolveVisitedProvinces(citiesFromApi, allProvinceNames) {
  const byNorm = new Map(
    allProvinceNames.map((n) => [normKey(n), n]),
  );

  const provinces = [];
  const seen = new Set();

  for (const raw of citiesFromApi || []) {
    if (!raw || typeof raw !== "string") continue;
    const nk = normKey(raw.trim());
    let resolved = CITY_TO_PROVINCE_NORM[nk];
    if (!resolved && byNorm.has(nk)) resolved = byNorm.get(nk);
    if (!resolved) {
      const partial = [...byNorm.entries()].find(
        ([k]) => k.includes(nk) || nk.includes(k),
      );
      if (partial) [, resolved] = partial;
    }
    if (!resolved) continue;
    const canon = byNorm.get(normKey(resolved)) || resolved;
    const canonNorm = normKey(canon);
    if (seen.has(canonNorm)) continue;
    seen.add(canonNorm);
    provinces.push(canon);
  }

  const fillByNormKey = new Map();
  provinces.forEach((p, i) => {
    fillByNormKey.set(
      normKey(p),
      VISIT_PALETTE[i % VISIT_PALETTE.length],
    );
  });

  return { provinces, fillByNormKey };
}
