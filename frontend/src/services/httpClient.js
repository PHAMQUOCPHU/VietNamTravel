import axios from "axios";

export const withTokenHeader = (token) => ({
  headers: { token },
});

/** Timeout dài để chờ backend cold-start (free tier). */
function resolveHttpTimeoutMs() {
  const raw = import.meta.env.VITE_HTTP_TIMEOUT_MS;
  if (raw == null || String(raw).trim() === "") return 120_000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 3000 ? n : 120_000;
}

export const buildHttpClient = (backendUrl) =>
  axios.create({
    baseURL: backendUrl?.trim?.() || "",
    timeout: resolveHttpTimeoutMs(),
  });
