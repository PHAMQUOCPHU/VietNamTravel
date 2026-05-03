const DEFAULT_BACKEND_URL = "http://localhost:5001";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const BACKEND_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL,
);

export const BACKEND_BASE_URL = BACKEND_URL.replace(/\/api\/?$/i, "");

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info("[env] BACKEND_URL =", BACKEND_URL);
} else {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "" ||
    host.endsWith(".local");
  const pointsToLocal =
    BACKEND_URL.includes("localhost") || BACKEND_URL.includes("127.0.0.1");
  if (!isLocalHost && pointsToLocal) {
    // eslint-disable-next-line no-console
    console.error(
      "[env] VITE_BACKEND_URL đang trỏ tới localhost trong bản build production. " +
        "Thêm biến VITE_BACKEND_URL đúng backend (HTTPS) trên Vercel → Settings → Environment Variables, rồi deploy lại.",
    );
  }
}
