/** Chuỗi chỉ gồm chữ số (có thể có dấu chấm cách nghìn) → format hiển thị vi-VN */
export function formatSalaryDisplay(value) {
  const t = String(value ?? "").trim();
  if (!t) return "";
  const stripped = t.replace(/\./g, "").replace(/\s/g, "");
  if (/^\d+$/.test(stripped)) {
    return Number(stripped).toLocaleString("vi-VN");
  }
  return t;
}

export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/** Gõ trong form: chỉ giữ số, hiển thị nhóm 3 bằng dấu chấm */
export function formatSalaryInputThousands(value) {
  const d = digitsOnly(value);
  if (!d) return "";
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Lưu API: nếu toàn bộ là số (sau khi bỏ dấu cách/ngăn cách) thì chuỗi chữ số thuần; không thì giữ nguyên */
export function normalizeSalaryForApi(value) {
  const t = String(value ?? "").trim();
  if (!t) return "";
  const stripped = t.replace(/\./g, "").replace(/\s/g, "");
  if (/^\d+$/.test(stripped)) return stripped;
  return t;
}

/** Mở form sửa: chuỗi DB dạng số → hiển thị có dấu chấm */
export function salaryFromDbToInput(value) {
  const t = String(value ?? "").trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return formatSalaryInputThousands(t);
  return t;
}
