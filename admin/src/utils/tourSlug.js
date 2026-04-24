export const slugifyTourTitle = (value = "") =>
  String(value)
    .replace(/\u0110|\u0111/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const buildTourSlug = (tour) => {
  const fromApi = String(tour?.slug || "").trim();
  if (fromApi) return fromApi;
  return slugifyTourTitle(tour?.title || "") || "tour";
};
