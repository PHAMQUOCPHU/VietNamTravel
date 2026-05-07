import { buildHttpClient, withTokenHeader } from "./httpClient";

export const listDiaries = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/diaries/list", withTokenHeader(token));
  return data;
};

export const listEligibleDiariesBookings = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/diaries/eligible", withTokenHeader(token));
  return data;
};

export const createDiary = async ({
  backendUrl,
  token,
  payload,
  images = [],
}) => {
  const client = buildHttpClient(backendUrl);
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v == null) return;
    formData.append(k, String(v));
  });
  images.forEach((img) => formData.append("images", img));

  const { data } = await client.post("/api/diaries/create", formData, {
    headers: {
      ...withTokenHeader(token).headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

