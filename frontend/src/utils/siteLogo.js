export const DEFAULT_SITE_LOGO_SRC = "/logo.png";

export const resolveSiteLogoSrc = (logoUrl) => {
  const t = typeof logoUrl === "string" ? logoUrl.trim() : "";
  return t ? t : DEFAULT_SITE_LOGO_SRC;
};

/**
 * Đồng bộ favicon & apple-touch-icon với logo đã set (CDN hoặc mặc định).
 */
export function applySiteBrandingIcons(logoSrcResolved) {
  const href =
    typeof logoSrcResolved === "string" && logoSrcResolved.trim()
      ? logoSrcResolved.trim()
      : DEFAULT_SITE_LOGO_SRC;

  const isRemote = /^https?:\/\//i.test(href);

  const ensureLink = (rel) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
    if (isRemote) {
      el.removeAttribute("type");
    } else {
      el.setAttribute("type", "image/png");
    }
    return el;
  };

  ensureLink("icon");
  ensureLink("shortcut icon");
  ensureLink("apple-touch-icon");
}
