/** Đồng bộ với slug tour ở frontend / tourController */
export function slugifyTourTitle(value = "") {
  return String(value)
    .replace(/\u0110|\u0111/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
