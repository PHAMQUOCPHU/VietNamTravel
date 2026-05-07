/**
 * Chuẩn hoá URL gốc backend để nối `${origin}/api/...` đúng một lần.
 * Nếu trong .env đặt VITE_BACKEND_URL=http://host:port/api (sai nhưng hay gặp),
 * gỡ /api để không thành /api/api/user/...
 */

/** Gửi nhầm API vào cổng Vite → luôn 404 (SPA không có POST /api/...). */
const LIKELY_VITE_PORTS = /:(5173|5174|4173)(\/|$)/i;

function remapIfPointingAtViteDevServer(origin) {
  const s = String(origin ?? "").trim();
  if (!s || !LIKELY_VITE_PORTS.test(s)) return s;
  if (import.meta.env.DEV) {
    console.warn(
      "[Admin] VITE_BACKEND_URL có vẻ trỏ nhầm tới cổng Vite (%s); dùng http://localhost:5001 cho API.",
      s,
    );
  }
  return "http://localhost:5001";
}

export function normalizeBackendOrigin(raw) {
  let u = String(raw ?? "").trim();
  if (!u) return "http://localhost:5001";
  u = u.replace(/\/+$/, "");
  const lower = u.toLowerCase();
  if (lower.endsWith("/api")) {
    u = u.slice(0, -4).replace(/\/+$/, "");
  }
  u = remapIfPointingAtViteDevServer(u);
  return u || "http://localhost:5001";
}
