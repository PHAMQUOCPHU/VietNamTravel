const trimTrailingSlash = (value) => String(value).replace(/\/+$/, "");

let warnedMissingPublicSiteUrl = false;

/**
 * URL gốc của site khách (frontend user), không phải origin của admin panel.
 * Dùng cho link mở tab "Xem bài viết" (/blog/:id).
 *
 * Ưu tiên: VITE_PUBLIC_SITE_URL → VITE_FRONTEND_URL (tên cũ).
 * Dev không set: mặc định http://localhost:5174 (trùng cổng frontend trong repo).
 */
export function getPublicSiteBaseUrl() {
  const fromEnv =
    import.meta.env.VITE_PUBLIC_SITE_URL?.trim() ||
    import.meta.env.VITE_FRONTEND_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);

  if (import.meta.env.DEV) return "http://localhost:5174";

  if (import.meta.env.PROD && typeof window !== "undefined" && !warnedMissingPublicSiteUrl) {
    warnedMissingPublicSiteUrl = true;
    console.error(
      "[admin] Chưa cấu VITE_PUBLIC_SITE_URL (URL site khách, ví dụ https://vietnamtravel.com). " +
        "Link Xem bài viết đang dùng window.location.origin — sai nếu admin tách subdomain/port.",
    );
  }

  return trimTrailingSlash(typeof window !== "undefined" ? window.location.origin : "");
}

export function getBlogPublicUrl(postId) {
  return `${getPublicSiteBaseUrl()}/blog/${postId}`;
}
