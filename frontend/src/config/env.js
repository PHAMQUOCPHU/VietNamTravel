const DEFAULT_BACKEND_URL = "http://localhost:5001";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const BACKEND_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL,
);

export const BACKEND_BASE_URL = BACKEND_URL.replace(/\/api\/?$/i, "");
