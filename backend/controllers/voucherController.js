import voucherModel from "../models/voucherModel.js";

// Lấy tất cả voucher cho Admin
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await voucherModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, vouchers });
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy voucher public cho Frontend (đang hoạt động & chưa hết hạn)
const getPublicVouchers = async (req, res) => {
  try {
    const vouchers = await voucherModel.find({
      isActive: true,
      expiryDate: { $gt: new Date() } // chỉ lấy những voucher chưa hết hạn
    }).sort({ discountValue: -1 });
    res.json({ success: true, vouchers });
  } catch (error) {
    console.error("Error fetching public vouchers:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin tạo voucher mới
const createVoucher = async (req, res) => {
  try {
    const { code, discountValue, minOrderValue, usageLimit, expiryDate, isActive } = req.body;
    
    // Kiểm tra trùng lặp
    const existingVoucher = await voucherModel.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      return res.json({ success: false, message: "Mã Voucher đã tồn tại" });
    }

    const newVoucher = new voucherModel({
      code,
      discountValue,
      minOrderValue,
      usageLimit,
      expiryDate,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await newVoucher.save();
    res.json({ success: true, message: "Tạo Voucher thành công" });
  } catch (error) {
    console.error("Error creating voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin sửa voucher
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Đảm bảo code là uppercase nếu có thay đổi code
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      // Kiểm tra xem code mới có bị trùng với voucher khác không
      const existing = await voucherModel.findOne({ code: updateData.code, _id: { $ne: id } });
      if (existing) {
        return res.json({ success: false, message: "Mã Voucher đã tồn tại ở một Voucher khác" });
      }
    }
    
    const updatedVoucher = await voucherModel.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedVoucher) {
      return res.json({ success: false, message: "Không tìm thấy Voucher" });
    }
    
    res.json({ success: true, message: "Cập nhật Voucher thành công" });
  } catch (error) {
    console.error("Error updating voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin xoá voucher
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVoucher = await voucherModel.findByIdAndDelete(id);
    if (!deletedVoucher) {
      return res.json({ success: false, message: "Không tìm thấy Voucher" });
    }
    res.json({ success: true, message: "Xóa Voucher thành công" });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

// Frontend Áp dụng voucher
const applyVoucher = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const userId = req.userId; // Được đính kèm từ authUser middleware
    
    if (!code || orderValue === undefined) {
      return res.json({ success: false, message: "Thiếu thông tin mã hoặc giá trị đơn hàng" });
    }
    
    const voucher = await voucherModel.findOne({ code: code.toUpperCase() });
    
    if (!voucher) {
      return res.json({ success: false, message: "Mã giảm giá không tồn tại" });
    }
    
    // Nếu status không phải active, hoặc isActive là false
    if (!voucher.isActive || voucher.status !== "active") {
      if (voucher.status === "expired") {
        return res.json({ success: false, message: "Mã giảm giá đã hết hạn" });
      }
      if (voucher.status === "exhausted") {
        return res.json({ success: false, message: "Mã đã hết lượt sử dụng" });
      }
      return res.json({ success: false, message: "Mã giảm giá đã bị vô hiệu hóa" });
    }

    // Kiểm tra xem khách đã dùng chưa
    if (voucher.usedBy && voucher.usedBy.includes(userId)) {
      return res.json({ success: false, message: "Bạn đã sử dụng mã này cho đơn hàng khác" });
    }
    
    // Kiểm tra hết hạn động
    if (new Date(voucher.expiryDate) < new Date()) {
      voucher.status = "expired";
      await voucher.save();
      return res.json({ success: false, message: "Mã đã hết hạn" });
    }
    
    // Kiểm tra hết lượt động
    if (voucher.usedCount >= voucher.usageLimit) {
      voucher.status = "exhausted";
      await voucher.save();
      return res.json({ success: false, message: "Mã đã hết lượt sử dụng" });
    }
    
    if (orderValue < voucher.minOrderValue) {
      return res.json({ 
        success: false, 
        message: `Đơn hàng tối thiểu để áp dụng mã là ${voucher.minOrderValue.toLocaleString()}đ` 
      });
    }
    
    // Hợp lệ, trả về số tiền được giảm
    // discountValue có thể là số tiền (ví dụ 100,000)
    // Hoặc có thể thêm logic phần trăm nếu cần, hiện tại theo yêu cầu ta dùng số tiền giảm trực tiếp.
    let finalDiscount = voucher.discountValue;
    
    // Nếu mức giảm lớn hơn giá trị đơn hàng, chỉ giảm tối đa bằng giá trị đơn hàng
    if (finalDiscount > orderValue) {
      finalDiscount = orderValue;
    }
    
    res.json({ 
      success: true, 
      discountAmount: finalDiscount, 
      code: voucher.code,
      message: "Áp dụng mã giảm giá thành công!"
    });
    
  } catch (error) {
    console.error("Error applying voucher:", error);
    res.json({ success: false, message: error.message });
  }
};

export { getAllVouchers, getPublicVouchers, createVoucher, updateVoucher, deleteVoucher, applyVoucher };
