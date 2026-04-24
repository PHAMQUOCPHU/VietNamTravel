import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getUnreadNotificationCountApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(
    "/api/notifications/unread-count",
    withTokenHeader(token),
  );
  return data;
};

export const getNotificationsApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get("/api/notifications", withTokenHeader(token));
  return data;
};

export const readAllNotificationsApi = async ({ backendUrl, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    "/api/notifications/read-all",
    {},
    withTokenHeader(token),
  );
  return data;
};
