import { getBlogsApi } from "../api";

export const getBlogs = async ({ backendUrl, category = "all", date = "" }) => {
  const params = {};
  if (category !== "all") params.category = category;
  if (date) params.date = date;
  return getBlogsApi({ backendUrl, params });
};
