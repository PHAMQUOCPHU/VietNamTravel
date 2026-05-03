import { buildHttpClient } from "./httpClient";

export const getBlogsApi = async ({ backendUrl, params, signal }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/blog/list-blogs", {
    params,
    signal,
  });
  return data;
};
