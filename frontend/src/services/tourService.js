import { buildHttpClient } from "./httpClient";

export const getTours = async ({ backendUrl }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/tour/list");
  return data;
};

export const getTourById = async ({ backendUrl, tourId }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(`/api/tour/single/${tourId}`);
  return data;
};
