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

export function formatSalaryInputThousands(value) {
  const d = digitsOnly(value);
  if (!d) return "";
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function normalizeSalaryForApi(value) {
  const t = String(value ?? "").trim();
  if (!t) return "";
  const stripped = t.replace(/\./g, "").replace(/\s/g, "");
  if (/^\d+$/.test(stripped)) return stripped;
  return t;
}

export function salaryFromDbToInput(value) {
  const t = String(value ?? "").trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return formatSalaryInputThousands(t);
  return t;
}
