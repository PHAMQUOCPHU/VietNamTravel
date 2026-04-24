export const slugifyTourTitle = (value = "") =>
  String(value)
    /** Đ/đ không bị tách thành ASCII trong NFD như dấu Latin — phải map thủ công kẻo slug thành "a-lat" */
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

export const isMongoObjectId = (slug = "") => {
  const value = String(slug).trim();
  return /^[a-f0-9]{24}$/i.test(value);
};
