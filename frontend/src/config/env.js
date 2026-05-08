const DEFAULT_BACKEND_URL = "http://localhost:5001";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const BACKEND_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL,
);

export const BACKEND_BASE_URL = BACKEND_URL.replace(/\/api\/?$/i, "");

if (import.meta.env.DEV) {
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
    console.error(
      "[env] VITE_BACKEND_URL đang trỏ tới localhost trong bản production. " +
        "Set VITE_BACKEND_URL = URL API HTTPS đầy đủ trên Vercel (Settings → Env) rồi Redeploy.",
    );
  }
  const pageHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const apiHttpOnly = BACKEND_URL.startsWith("http://") && !pointsToLocal;
  if (!isLocalHost && pageHttps && apiHttpOnly) {
    console.error(
      "[env] Mixed content: site HTTPS nhưng VITE_BACKEND_URL dùng http:// → trình duyệt thường chặn, gây timeout/lỗi mạng. " +
        "Hãy dùng HTTPS cho API hoặc bật HTTPS trên host backend (Railway/Render CDN URL).",
    );
  }
}
