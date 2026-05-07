import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getPublicVouchers = async ({ backendUrl, token, signal }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/vouchers/public", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
  return data;
};

export const applyVoucher = async ({ backendUrl, token, code, orderValue }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/vouchers/apply",
    { code, orderValue },
    withTokenHeader(token),
  );
  return data;
};

