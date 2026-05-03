import jwt from "jsonwebtoken";

function decodeToken(raw) {
  if (!raw || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(raw, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function firstBearer(req) {
  const a = req.headers.authorization;
  if (a && a.startsWith("Bearer ")) return a.slice(7).trim();
  return null;
}

/**
 * Đọc lịch sử 1 thread: admin (atoken/token + role admin) hoặc chính user (token Bearer / token header, id khớp :userId).
 */
export function allowAdminOrThreadUser(req, res, next) {
  const { userId } = req.params;
  if (!userId || userId === "ADMIN") {
    return res
      .status(400)
      .json({ success: false, message: "Tham số không hợp lệ" });
  }

  const raw =
    req.headers.atoken ||
    req.headers.token ||
    firstBearer(req);

  if (!raw) {
    return res
      .status(401)
      .json({ success: false, message: "Cần đăng nhập để xem tin nhắn" });
  }

  const decoded = decodeToken(raw);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }

  if (decoded.role === "admin") return next();
  if (String(decoded.id) === String(userId)) return next();

  return res
    .status(403)
    .json({ success: false, message: "Không có quyền xem cuộc trò chuyện này" });
}

/** Chỉ user đã đăng nhập và :userId trùng JWT (không dùng cho admin). */
export function requireUserMatchesParam(req, res, next) {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "Thiếu userId" });
  }
  if (!req.userId || String(req.userId) !== String(userId)) {
    return res.status(403).json({ success: false, message: "Không có quyền" });
  }
  next();
}
