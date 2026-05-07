import defaultAdminLogo from "../assets/images/logo.png";

/** Ảnh logo panel admin — CDN hoặc asset build mặc định */
export function resolveAdminPanelLogoSrc(storedUrl) {
  const t = typeof storedUrl === "string" ? storedUrl.trim() : "";
  return t ? t : defaultAdminLogo;
}

/** Favicon tab trình duyệt trong app admin — đồng bộ với logo sidebar */
export function applyAdminPanelFavicon(logoSrcResolved) {
  try {
    if (typeof document === "undefined") return;

  const href =
    typeof logoSrcResolved === "string" ? logoSrcResolved : defaultAdminLogo;

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
  } catch {
    /* không chặn render app */
  }
}
