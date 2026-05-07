import { buildHttpClient } from "./httpClient";

export const getTerms = async ({ backendUrl }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/terms");
  return data;
};

