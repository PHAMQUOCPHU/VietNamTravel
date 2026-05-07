import { buildHttpClient } from "./httpClient";

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

  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/blog/list-blogs", {
    params,
    signal,
  });
  return data;
};

export const getBlogDetail = async ({
  backendUrl,
  blogId,
  incrementView = true,
  viewerId,
  signal,
}) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(`/api/blog/${blogId}`, {
    params: { incrementView },
    headers: viewerId ? { "x-viewer-id": viewerId } : {},
    signal,
  });
  return data;
};

export const submitBlogComment = async ({ backendUrl, token, blogId, content }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    `/api/blog/${blogId}/comments`,
    { content },
    { headers: { token } },
  );
  return data;
};
