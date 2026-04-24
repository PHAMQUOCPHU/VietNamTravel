import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header 'token' hoặc 'Authorization' (Bearer...)
    const authHeader = req.headers.authorization;
    const token =
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null) || req.headers.token;

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Không tìm thấy token, vui lòng đăng nhập lại!",
        });
    }

    // Giải mã token bằng JWT_SECRET trong file .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lưu ID vào request để các hàm sau sử dụng
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Lỗi Auth Middleware:", error.message);
    // Trả về lỗi 401 để khớp với hình ảnh bạn chụp
    res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export default authMiddleware;
