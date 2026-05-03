import jwt from "jsonwebtoken";

const bearerFromAuth = (req) => {
  const a = req.headers.authorization;
  if (a && typeof a === "string" && a.startsWith("Bearer "))
    return a.slice(7).trim();
  return null;
};

const adminAuth = async (req, res, next) => {
  try {
    const token =
      req.headers.atoken ||
      req.headers.token ||
      bearerFromAuth(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không có quyền truy cập, hãy đăng nhập lại",
      });
    }

    // Giải mã token
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra role admin (Logic này của Phú giữ nguyên)
    if (token_decode.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền Admin",
      });
    }

    req.userId = token_decode.id;
    next();
  } catch (error) {
    console.log("Lỗi Admin Auth:", error.message);
    res.status(401).json({
      success: false,
      message: "Phiên làm việc hết hạn, vui lòng đăng nhập lại",
    });
  }
};

export default adminAuth;
