import otpModel from "../models/otpModel.js";
import transporter from "../config/nodemailer.js";
import cryptoRandomString from "crypto-random-string";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import bookingModel from "../models/bookingModel.js"; // NHỚ KIỂM TRA ĐƯỜNG DẪN NÀY
import { uploadBufferToCloudinary, CLOUDINARY_FOLDERS } from "../services/cloudinaryUpload.js";

// Hàm tạo Token
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
};

// 1. Gửi OTP
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Thiếu Email" });
    const otp = cryptoRandomString({ length: 6, type: "distinguishable" });
    await otpModel.findOneAndDelete({ email });
    await new otpModel({ email, otp }).save();
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Mã xác thực VietNam Travel",
      text: `Mã của bạn là: ${otp}`,
    });
    res.json({ success: true, message: "Mã OTP đã được gửi!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 2. Đăng ký người dùng mới
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone = "" } = req.body;
    const userExists = await userModel.findOne({ email });
    if (userExists)
      return res.json({ success: false, message: "Email đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      phone: phone.trim(),
      role: "user",
      favorites: [],
    });

    const user = await newUser.save();
    const token = createToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        role: user.role,
        favorites: user.favorites,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 3. Đăng nhập người dùng (QUAN TRỌNG: Luôn populate favorites)
export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
      userCaptcha,
      serverCaptcha,
      adminLogin = false,
    } = req.body;

    const user = await userModel.findOne({ email }).populate("favorites");
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Mật khẩu không chính xác" });
    }

    // Khi đăng nhập từ trang admin, ưu tiên báo lỗi quyền truy cập thay vì captcha
    if (adminLogin && user.role !== "admin") {
      return res.json({
        success: false,
        message: "Bạn không có quyền quản trị viên",
      });
    }

    // Chỉ frontend user login mới cần captcha
    if (!adminLogin && user.role !== "admin") {
      if (
        !userCaptcha ||
        !serverCaptcha ||
        userCaptcha.toLowerCase() !== serverCaptcha.toLowerCase()
      ) {
        return res.json({
          success: false,
          message: "Mã Captcha không chính xác",
        });
      }
    }

    const token = createToken(user._id, user.role);

    // Trả về thông tin user (không kèm password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.json({ success: false, message: "Lỗi hệ thống: " + error.message });
  }
};

// 4. Quên mật khẩu
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Email chưa đăng ký!" });
    const otp = cryptoRandomString({ length: 6, type: "distinguishable" });
    await otpModel.findOneAndDelete({ email });
    await new otpModel({ email, otp }).save();
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Yêu cầu Khôi phục mật khẩu - VietNam Travel",
      text: `Mã của bạn là: ${otp}`,
    });
    res.json({ success: true, message: "Mã OTP đã được gửi!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 5. Xác thực OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, name, password, phone = "" } = req.body;
    const otpRecord = await otpModel.findOne({ email, otp: otp.trim() });
    if (!otpRecord)
      return res.json({ success: false, message: "Mã OTP sai hoặc hết hạn!" });

    if (name) {
      if (phone && !/^0\d{9,10}$/.test(phone.trim())) {
        return res.json({
          success: false,
          message: "Số điện thoại không hợp lệ (bắt đầu bằng 0, 10-11 số)",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
        phone: phone.trim(),
      });
      await newUser.save();
      await otpModel.deleteOne({ _id: otpRecord._id });
      return res.json({ success: true, message: "Đăng ký thành công!" });
    }

    await otpModel.deleteOne({ _id: otpRecord._id });
    res.json({ success: true, message: "Xác thực thành công!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 6. Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await userModel.findOneAndUpdate({ email }, { password: hashedPassword });
    res.json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 7. Change Password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;
    const user = await userModel.findById(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.json({ success: false, message: "Mật khẩu hiện tại sai" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 8. Get Profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel
      .findById(userId)
      .select("-password")
      .populate("favorites");
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 9. Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone) {
      return res.json({ success: false, message: "Thiếu thông tin cơ bản" });
    }

    if (!/^0\d{9,10}$/.test(String(phone).trim())) {
      return res.json({
        success: false,
        message: "Số điện thoại không hợp lệ (bắt đầu bằng 0, 10-11 số)",
      });
    }

    const updateData = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      dob: dob || null,
      gender: gender || "male",
    };

    if (imageFile) {
      updateData.image = await uploadBufferToCloudinary(
        imageFile,
        CLOUDINARY_FOLDERS.avatars,
      );
    }

    await userModel.findByIdAndUpdate(userId, updateData);
    const updatedUser = await userModel
      .findById(userId)
      .select("-password")
      .populate("favorites");

    res.json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.json({ success: false, message: "Lỗi hệ thống: " + error.message });
  }
};

// 10. Lấy danh sách tất cả User (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, users });
  } catch (error) {
    res.json({
      success: false,
      message: "Lỗi Server khi lấy danh sách người dùng",
    });
  }
};

// 11. Xóa User (Admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.body;
    const adminId = req.userId;
    const user = await userModel.findById(id);
    if (!user) {
      return res.json({
        success: false,
        message: "Không tìm thấy người dùng này!",
      });
    }

    if (String(user._id) === String(adminId)) {
      return res.json({
        success: false,
        message: "Không thể xóa chính tài khoản đang đăng nhập.",
      });
    }

    if (user.role === "admin") {
      return res.json({
        success: false,
        message: "Không thể xóa tài khoản quản trị viên.",
      });
    }

    await userModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xóa người dùng thành công!" });
  } catch (error) {
    res.json({ success: false, message: "Lỗi Server khi xóa người dùng" });
  }
};

const RANKS = ["Bạc", "Vàng", "Kim cương"];
const ROLES = ["user", "admin"];

// 11b. Cập nhật vai trò / hạng (Admin)
export const updateUserAdmin = async (req, res) => {
  try {
    const { userId, role, rank, totalSpent } = req.body;
    const adminId = req.userId;

    if (!userId) {
      return res.json({ success: false, message: "Thiếu userId" });
    }

    const target = await userModel.findById(userId);
    if (!target) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const update = {};

    if (role !== undefined && role !== null && role !== "") {
      if (!ROLES.includes(role)) {
        return res.json({ success: false, message: "Vai trò không hợp lệ" });
      }
      if (String(target._id) === String(adminId) && role === "user") {
        return res.json({
          success: false,
          message: "Không thể tự hạ quyền quản trị của chính bạn.",
        });
      }
      update.role = role;
    }

    if (rank !== undefined && rank !== null && rank !== "") {
      if (!RANKS.includes(rank)) {
        return res.json({ success: false, message: "Hạng không hợp lệ" });
      }
      update.rank = rank;
    }

    if (totalSpent !== undefined && totalSpent !== null && totalSpent !== "") {
      const n = Number(totalSpent);
      if (!Number.isFinite(n) || n < 0) {
        return res.json({
          success: false,
          message: "Tổng chi tiêu không hợp lệ",
        });
      }
      update.totalSpent = n;
    }

    if (Object.keys(update).length === 0) {
      return res.json({
        success: false,
        message: "Không có trường hợp lệ để cập nhật",
      });
    }

    await userModel.findByIdAndUpdate(userId, update);
    const updated = await userModel.findById(userId).select("-password");

    res.json({
      success: true,
      message: "Cập nhật người dùng thành công",
      user: updated,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 11c. Chi tiết người dùng (Admin)
export const getUserDetailAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("-password").lean();

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const bookings = await bookingModel.find({ userId: id }).lean();
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.status === "confirmed" || b.status === "Đã xác nhận",
    );
    const totalSpent = confirmedBookings.reduce(
      (sum, b) => sum + (Number(b.totalPrice) || 0),
      0,
    );

    res.json({
      success: true,
      user: {
        ...user,
        totalSpent,
      },
      bookingStats: {
        totalBookings,
        confirmedBookings: confirmedBookings.length,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 12. Toggle Favorite
export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { tourId } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const isFavorite = user.favorites.includes(tourId);

    if (isFavorite) {
      user.favorites = user.favorites.filter((id) => id.toString() !== tourId);
    } else {
      user.favorites.push(tourId);
    }

    await user.save();

    res.json({
      success: true,
      message: isFavorite ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
      favorites: user.favorites,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 13. LẤY DANH SÁCH ĐƠN HÀNG CỦA USER (MỚI THÊM ĐỂ FIX LỖI 404)
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId;
    const bookings = await bookingModel.find({ userId });

    // 1. Tính tổng tiền từ các đơn "confirmed"
    const totalSpent = bookings
      .filter(
        (order) =>
          order.status === "confirmed" || order.status === "Đã xác nhận",
      )
      .reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);

    // 2. Xác định hạng dựa trên tổng chi tiêu
    let newRank = "Bạc";
    if (totalSpent >= 30000000) {
      newRank = "Kim cương";
    } else if (totalSpent >= 10000000) {
      newRank = "Vàng";
    }

    // 3. Cập nhật hạng mới vào Database nếu có thay đổi
    await userModel.findByIdAndUpdate(userId, { rank: newRank });

    res.json({ success: true, bookings, totalSpent, rank: newRank });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
