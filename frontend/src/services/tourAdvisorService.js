import { buildHttpClient } from "./httpClient";

export const askTourAdvisor = async ({ backendUrl, message, timeoutMs = 25000 }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/tour-advisor",
    { message },
    { timeout: timeoutMs },
  );
  return data;
};

