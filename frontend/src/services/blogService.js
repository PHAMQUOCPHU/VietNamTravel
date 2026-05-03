import { getBlogsApi } from "../api";

export const getBlogs = async ({
  backendUrl,
  category = "all",
  date = "",
  search = "",
  signal,
}) => {
  // Backend cũ mặc định limit=5 khi không có query — ép tải đủ ít nhất một “trang lớn”
  // (cụt ở ~50/post cũ). Backend mới không dùng phân trang, bỏ qua các tham số này.
  const params = { limit: 5000 };
  if (category !== "all") params.category = category;
  if (date) params.date = date;
  if (search && String(search).trim()) params.search = String(search).trim();
  return getBlogsApi({ backendUrl, params, signal });
};
