import axios from "axios";

export const withTokenHeader = (token) => ({
  headers: { token },
});

export const buildHttpClient = (backendUrl) =>
  axios.create({
    baseURL: backendUrl?.trim?.() || "",
  });
