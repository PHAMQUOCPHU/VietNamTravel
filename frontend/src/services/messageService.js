import { buildHttpClient, withTokenHeader } from "./httpClient";

export const getUserMessages = async ({ backendUrl, userId, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(`/api/messages/${userId}`, withTokenHeader(token));
  return data;
};

export const markMessagesReadForUser = async ({ backendUrl, userId, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.post(
    `/api/messages/user/mark-read/${userId}`,
    {},
    withTokenHeader(token),
  );
  return data;
};

export const getUnreadCountForUser = async ({ backendUrl, userId, token }) => {
  const client = buildHttpClient(backendUrl);
  const { data } = await client.get(
    `/api/messages/user/unread-count/${userId}`,
    withTokenHeader(token),
  );
  return data;
};

export const uploadChatImageForUser = async ({ backendUrl, token, file }) => {
  const client = buildHttpClient(backendUrl);
  const fd = new FormData();
  fd.append("image", file);
  const { data } = await client.post("/api/messages/chat-image/user", fd, {
    headers: {
      ...withTokenHeader(token).headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

