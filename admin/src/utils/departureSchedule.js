/** Hiển thị chip lịch khởi hành (YYYY-MM-DD hoặc YYYY-MM-DD|HH:mm) */
export function formatDepartureSlotLabel(slot) {
  if (!slot) return "";
  const s = String(slot).trim();
  if (s.includes("|")) {
    const [d, t] = s.split("|");
    const parts = d.split("-");
    if (parts.length === 3) {
      const [y, m, day] = parts;
      return `${day}/${m}/${y} · ${t}`;
    }
    return `${d} · ${t}`;
  }
  const parts = s.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    return `${day}/${m}/${y}`;
  }
  return s;
}

/** Ghép ngày + giờ thành chuỗi lưu API */
export function buildManualDepartureSlot(dateInput, timeInput) {
  const t = (timeInput || "07:00").slice(0, 5);
  return dateInput ? `${dateInput}|${t}` : "";
}

/**
 * Trước khi gửi API (chế độ thủ công): mỗi slot luôn có dạng YYYY-MM-DD|HH:mm,
 * lấy phần ngày từ chip và giờ từ ô chọn giờ — để chỉnh giồ + Lưu thật sự cập nhật lịch.
 */
export function normalizeManualDepartureSlotsForSave(slots, timeInput) {
  const timeStr = (timeInput || "07:00").slice(0, 5);
  if (!Array.isArray(slots)) return [];
  return slots
    .map((s) => {
      const str = String(s ?? "").trim();
      if (!str) return null;
      const datePart = str.includes("|") ? str.split("|")[0].trim() : str;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
      return `${datePart}|${timeStr}`;
    })
    .filter(Boolean);
}
