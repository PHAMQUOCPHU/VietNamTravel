export function isMongoObjectId(value) {
  const s = String(value || "").trim();
  return s.length === 24 && /^[a-f0-9]{24}$/i.test(s);
}

export function slugifyBlogTitle(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

const B64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const bytesToBase64Url = (bytes) => {
  const src = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  let out = "";
  for (let i = 0; i < src.length; i += 3) {
    const a = src[i];
    const b = i + 1 < src.length ? src[i + 1] : 0;
    const c = i + 2 < src.length ? src[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;

    out += B64_ALPHABET[(triple >> 18) & 63];
    out += B64_ALPHABET[(triple >> 12) & 63];
    out += i + 1 < src.length ? B64_ALPHABET[(triple >> 6) & 63] : "=";
    out += i + 2 < src.length ? B64_ALPHABET[triple & 63] : "=";
  }

  // base64url (no padding)
  return out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlToBytes = (s) => {
  const raw = String(s || "").trim();
  if (!raw) return new Uint8Array(0);
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");

  // Build decode table once per call (tiny strings; keep simple)
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64_ALPHABET.length; i += 1) {
    table[B64_ALPHABET.charCodeAt(i)] = i;
  }

  const bytes = [];
  for (let i = 0; i < padded.length; i += 4) {
    const c1 = padded.charCodeAt(i);
    const c2 = padded.charCodeAt(i + 1);
    const c3 = padded.charCodeAt(i + 2);
    const c4 = padded.charCodeAt(i + 3);

    const v1 = c1 < 128 ? table[c1] : -1;
    const v2 = c2 < 128 ? table[c2] : -1;
    const v3 = c3 === 61 ? 0 : c3 < 128 ? table[c3] : -1; // '='
    const v4 = c4 === 61 ? 0 : c4 < 128 ? table[c4] : -1;

    if (v1 < 0 || v2 < 0 || v3 < 0 || v4 < 0) {
      throw new Error("INVALID_BASE64");
    }

    const triple = (v1 << 18) | (v2 << 12) | (v3 << 6) | v4;
    bytes.push((triple >> 16) & 255);
    if (c3 !== 61) bytes.push((triple >> 8) & 255);
    if (c4 !== 61) bytes.push(triple & 255);
  }

  return new Uint8Array(bytes);
};

export function encodeObjectIdToUrlToken(objectIdHex) {
  const hex = String(objectIdHex || "").trim();
  if (!isMongoObjectId(hex)) return "";
  const bytes = new Uint8Array(12);
  for (let i = 0; i < 12; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytesToBase64Url(bytes);
}

export function decodeUrlTokenToObjectId(token) {
  const t = String(token || "").trim();
  if (!t) return "";
  // Token của ObjectId (12 bytes) => base64url length thường 16 (không padding)
  if (!/^[A-Za-z0-9_-]{16,22}$/.test(t)) return "";
  try {
    const bytes = base64UrlToBytes(t);
    if (!bytes || bytes.length !== 12) return "";
    let hex = "";
    for (let i = 0; i < bytes.length; i += 1) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return isMongoObjectId(hex) ? hex : "";
  } catch {
    return "";
  }
}

export function buildBlogSlug(blog) {
  const id = blog?._id != null ? String(blog._id) : "";
  const base = slugifyBlogTitle(blog?.title || "bai-viet") || "bai-viet";
  if (!id) return base;
  const token = encodeObjectIdToUrlToken(id);
  return `${base}-${token || id}`;
}

export function extractBlogIdFromSlug(slugOrId) {
  const s = String(slugOrId || "").trim();
  if (isMongoObjectId(s)) return s;
  const hexMatch = s.match(/([a-f0-9]{24})$/i);
  if (hexMatch) return hexMatch[1];
  // Token base64url của ObjectId luôn nằm sau dấu "-" cuối cùng trong slug
  // (vì bản thân token có thể chứa "-" hoặc "_" nên không thể regex đơn giản tới cuối chuỗi).
  const lastPart = s.split("-").filter(Boolean).pop() || "";
  if (/^[A-Za-z0-9_-]{16,22}$/.test(lastPart)) {
    return decodeUrlTokenToObjectId(lastPart);
  }
  return "";
}

