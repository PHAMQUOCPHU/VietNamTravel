import { buildHttpClient } from "./httpClient";

export const getBlogsApi = async ({ backendUrl, params }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/blog/list-blogs", { params });
  return data;
};
