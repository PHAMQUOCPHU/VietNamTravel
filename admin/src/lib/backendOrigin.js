/**
 * Chuẩn hoá URL gốc backend để nối `${origin}/api/...` đúng một lần.
 * Nếu trong .env đặt VITE_BACKEND_URL=http://host:port/api (sai nhưng hay gặp),
 * gỡ /api để không thành /api/api/user/...
 */
export function normalizeBackendOrigin(raw) {
  let u = String(raw ?? "").trim();
  if (!u) return "http://localhost:5001";
  u = u.replace(/\/+$/, "");
  const lower = u.toLowerCase();
  if (lower.endsWith("/api")) {
    u = u.slice(0, -4).replace(/\/+$/, "");
  }
  return u || "http://localhost:5001";
}
